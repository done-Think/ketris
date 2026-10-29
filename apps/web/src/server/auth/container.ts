import { UploadAvatarUseCase } from './application/use-cases/upload-avatar.use-case'
import { S3AvatarStorage } from './infrastructure/s3-avatar-storage'
import { ApproveUserMembershipUseCase } from './application/use-cases/approve-user-membership.use-case'
import { ChangeOwnPasswordUseCase } from './application/use-cases/change-own-password.use-case'
import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case'
import { GetUserUseCase } from './application/use-cases/get-user.use-case'
import { ListUsersUseCase } from './application/use-cases/list-users.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { LogoutUseCase } from './application/use-cases/logout.use-case'
import { RefreshAccessTokenUseCase } from './application/use-cases/refresh-access-token.use-case'
import { RequestPasswordResetCodeUseCase } from './application/use-cases/request-password-reset-code.use-case'
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case'
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case'
import { VerifyPasswordResetCodeUseCase } from './application/use-cases/verify-password-reset-code.use-case'
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher'
import { JosePasswordResetTokenService } from './infrastructure/jose-password-reset-token.service'
import { JoseTokenService } from './infrastructure/jose-token.service'
import { PrismaEmailOwnershipCodeRepository } from './infrastructure/prisma-email-ownership-code.repository'
import { PrismaPasswordResetAccountRepository } from './infrastructure/prisma-password-reset-account.repository'
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'
import { SesMailer } from '@server/shared/email/ses-mailer'

import { PrismaUserPortfolioReader } from './infrastructure/prisma-user-portfolio.reader'
import { ValidateAccessTokenUseCase } from './application/use-cases/validate-access-token.use-case'
import { ValidateSessionTokensUseCase } from './application/use-cases/validate-session-tokens.use-case'
import { ValidatedTokenService } from './infrastructure/validated-token.service'
import { PrismaEmailVerificationRepository } from './infrastructure/prisma-email-verification.repository'
import { RequestSignupVerificationUseCase } from './application/use-cases/request-signup-verification.use-case'
import { ConfirmSignupVerificationUseCase } from './application/use-cases/confirm-signup-verification.use-case'
import { RequestEmailChangeUseCase } from './application/use-cases/request-email-change.use-case'
import { ConfirmPublicEmailChangeUseCase } from './application/use-cases/confirm-public-email-change.use-case'
import { ConfirmEmailChangeUseCase } from './application/use-cases/confirm-email-change.use-case'

const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptPasswordHasher()
const jwtService = new JoseTokenService()
const validateAccessTokenUseCase = new ValidateAccessTokenUseCase(jwtService, userRepository)
const tokenService = new ValidatedTokenService(jwtService, validateAccessTokenUseCase)
const refreshTokenRepository = new PrismaRefreshTokenRepository()
const emailOwnershipCodeRepository = new PrismaEmailOwnershipCodeRepository()
const passwordResetAccountRepository = new PrismaPasswordResetAccountRepository()
const passwordResetTokenService = new JosePasswordResetTokenService()
const mailer = new SesMailer()
const emailVerificationRepository = new PrismaEmailVerificationRepository()

export const authContainer = {
  confirmPublicEmailChangeUseCase: new ConfirmPublicEmailChangeUseCase(
    userRepository,
    emailVerificationRepository,
  ),
  requestEmailChangeUseCase: new RequestEmailChangeUseCase(
    userRepository,
    emailVerificationRepository,
    mailer,
  ),
  confirmEmailChangeUseCase: new ConfirmEmailChangeUseCase(
    userRepository,
    emailVerificationRepository,
  ),
  requestSignupVerificationUseCase: new RequestSignupVerificationUseCase(
    userRepository,
    emailVerificationRepository,
    mailer,
  ),
  confirmSignupVerificationUseCase: new ConfirmSignupVerificationUseCase(
    userRepository,
    emailVerificationRepository,
    tokenService,
    refreshTokenRepository,
  ),
  uploadAvatarUseCase: new UploadAvatarUseCase(userRepository, new S3AvatarStorage()),
  tokenService,
  validateAccessTokenUseCase,
  validateSessionTokensUseCase: new ValidateSessionTokensUseCase(
    tokenService,
    refreshTokenRepository,
  ),
  userRepository,
  loginUseCase: new LoginUseCase(
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
  ),
  createUserUseCase: new CreateUserUseCase(userRepository, passwordHasher),
  listUsersUseCase: new ListUsersUseCase(userRepository),
  getUserUseCase: new GetUserUseCase(userRepository),
  updateUserUseCase: new UpdateUserUseCase(userRepository),
  deactivateUserUseCase: new DeactivateUserUseCase(userRepository, new PrismaUserPortfolioReader()),
  approveUserMembershipUseCase: new ApproveUserMembershipUseCase(userRepository),
  refreshAccessTokenUseCase: new RefreshAccessTokenUseCase(
    userRepository,
    tokenService,
    refreshTokenRepository,
  ),
  logoutUseCase: new LogoutUseCase(refreshTokenRepository),
  changeOwnPasswordUseCase: new ChangeOwnPasswordUseCase(userRepository, passwordHasher),
  requestPasswordResetCodeUseCase: new RequestPasswordResetCodeUseCase(
    userRepository,
    emailOwnershipCodeRepository,
    mailer,
  ),
  verifyPasswordResetCodeUseCase: new VerifyPasswordResetCodeUseCase(
    userRepository,
    emailOwnershipCodeRepository,
    passwordResetTokenService,
  ),
  resetPasswordUseCase: new ResetPasswordUseCase(
    userRepository,
    passwordHasher,
    passwordResetAccountRepository,
    passwordResetTokenService,
  ),
}
