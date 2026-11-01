import pt from '../../../src/i18n/messages/pt-BR/face_check.json'
import en from '../../../src/i18n/messages/en-US/face_check.json'
import es from '../../../src/i18n/messages/es-ES/face_check.json'

const token = 'f'.repeat(64)
const capturePath = `/api/face_check/capture/${token}`
const session = {
  token,
  agencyName: 'Synthetic agency',
  reference: 'Synthetic property',
  acceptedDocument: 'RG',
  status: 'CREATED',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2099-11-08T12:00:00Z',
  redoReason: null,
}
type Placement =
  'tooFar' | 'tooClose' | 'offCenter' | 'ready' | 'notFound' | 'multipleFaces' | 'unavailable'

// Synthetic camera and API only. No physical camera, person images or evidence writes.
describe('live selfie placement guidance', () => {
  for (const [locale, messages, mobile, near, far] of [
    ['pt', pt, false, 'Aproxime-se um pouco da câmera.', 'Afaste-se um pouco da câmera.'],
    [
      'en',
      en,
      false,
      'Move a little closer to the camera.',
      'Move a little farther from the camera.',
    ],
    ['es', es, false, 'Acércate un poco a la cámara.', 'Aléjate un poco de la cámara.'],
    [
      'pt',
      pt,
      true,
      'Aproxime um pouco o celular do rosto.',
      'Afaste um pouco o celular do rosto.',
    ],
  ] as const) {
    it(`tracks distance and alignment on ${mobile ? 'phone' : 'computer'} in ${locale}`, () => {
      let placement: Placement = 'tooFar'
      let appWindow: Window
      cy.viewport(mobile ? 390 : 1440, 900)
      cy.intercept('GET', capturePath, { body: session })
      cy.intercept('POST', `${capturePath}/consent`, { body: session })
      cy.intercept('POST', `${capturePath}/document`, { body: {} })
      cy.intercept('POST', `${capturePath}/framing`, (request) => {
        if (placement === 'unavailable') {
          request.reply({ statusCode: 503, body: { error: { code: 'ANALYSIS_UNAVAILABLE' } } })
          return
        }
        const video = appWindow.document.querySelector('video')!
        const stage = video.parentElement!
        const viewport = stage.getBoundingClientRect()
        const oval = stage.querySelector('[data-face-guide]')!.getBoundingClientRect()
        const ratio = placement === 'tooFar' ? 0.35 : placement === 'tooClose' ? 1.3 : 0.8
        const width = oval.width * ratio
        const height = oval.height * ratio
        const left =
          oval.left -
          viewport.left +
          (oval.width - width) / 2 +
          (placement === 'offCenter' ? oval.width * 0.4 : 0)
        const top = oval.top - viewport.top + (oval.height - height) / 2
        const scale = Math.max(viewport.width / 640, viewport.height / 360)
        const displayWidth = 640 * scale
        const displayHeight = 360 * scale
        request.reply({
          body: {
            width: 640,
            height: 360,
            faceCount: placement === 'notFound' ? 0 : placement === 'multipleFaces' ? 2 : 1,
            face:
              placement === 'notFound'
                ? null
                : {
                    x:
                      (viewport.width - left - width + (displayWidth - viewport.width) / 2) /
                      displayWidth,
                    y: (top + (displayHeight - viewport.height) / 2) / displayHeight,
                    width: width / displayWidth,
                    height: height / displayHeight,
                  },
          },
        })
      }).as('framing')
      cy.visit(`/${locale}/face_check/verify/${token}`, {
        onBeforeLoad(win) {
          appWindow = win
          Object.defineProperty(win.navigator, 'userAgentData', {
            configurable: true,
            value: { mobile },
          })
          Object.defineProperty(win.navigator, 'platform', {
            configurable: true,
            value: mobile ? 'iPhone' : 'MacIntel',
          })
          Object.defineProperty(win.navigator, 'userAgent', {
            configurable: true,
            value: mobile ? 'iPhone Mobile' : 'Macintosh Chrome',
          })
          const sensor = win.document.createElement('canvas')
          sensor.width = 1280
          sensor.height = 720
          const context = sensor.getContext('2d')!
          const paint = () => {
            context.fillStyle = '#375abc'
            context.fillRect(0, 0, 1280, 720)
          }
          paint()
          const stream = sensor.captureStream(10)
          win.setInterval(paint, 100)
          Object.defineProperty(win.navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia: async () => stream.clone() },
          })
        },
      })
      cy.contains('button', messages.capture.consent.start).click()
      cy.get('[role="dialog"] input[type="checkbox"]').check()
      cy.contains('button', messages.capture.consent.continue).click()
      cy.contains('button', messages.capture.camera.enable).click()
      cy.get('video').should('have.prop', 'videoWidth', 1280)
      cy.get(`button[aria-label="${messages.capture.document.shutter}"]`).click()
      cy.contains('h1', messages.capture.document.titleBack.replace('{doc}', 'RG')).should(
        'be.visible',
      )
      cy.get(`button[aria-label="${messages.capture.document.shutter}"]`).click()
      cy.contains('button', messages.capture.documentReview.confirm).click()
      cy.contains('[aria-live="polite"]', near).should('be.visible')
      cy.then(() => {
        placement = 'tooClose'
      })
      cy.contains('[aria-live="polite"]', far).should('be.visible')
      for (const next of [
        'offCenter',
        'notFound',
        'multipleFaces',
        'ready',
        'unavailable',
      ] as const) {
        cy.then(() => {
          placement = next
        })
        cy.contains('[aria-live="polite"]', messages.capture.selfie.framing[next]).should(
          'be.visible',
        )
      }
      cy.contains('button', messages.capture.live.takeSelfie).should('not.be.disabled')
    })
  }
})
