import { describe, expect, it } from 'vitest'
import { historyProperty as property } from '../fixtures/history-property'
import { propertyHistoryChanges } from '../../domain/property-history'

const refs = { ownerName: null }
describe('property audit differences', () => {
  it('keeps granted broker names and treats grants as an unordered set', () => {
    const before = { ...property, brokerIds: ['second', 'first'] }
    const after = { ...property, brokerIds: ['first', 'second'] }
    const references = {
      ownerName: null,
      brokers: [
        { id: 'first', name: 'Ana' },
        { id: 'second', name: 'Bruno' },
      ],
    }
    expect(propertyHistoryChanges(before, after, references, references)).toEqual([])
    expect(
      propertyHistoryChanges(
        before,
        { ...property, brokerIds: ['second'] },
        references,
        references,
      ),
    ).toEqual([
      {
        field: 'brokers',
        before: [
          { id: 'first', name: 'Ana' },
          { id: 'second', name: 'Bruno' },
        ],
        after: [{ id: 'second', name: 'Bruno' }],
      },
    ])
  })
  it('records negotiation choices separately from the free text observation', () => {
    const after = {
      ...property,
      listing: {
        ...property.listing,
        negotiationTerms: 'Entry to be agreed',
        negotiationConditions: ['ACCEPTS_FINANCING' as const],
      },
    }
    expect(propertyHistoryChanges(property, after, refs, refs)).toEqual([
      { field: 'listing.negotiationTerms', before: null, after: 'Entry to be agreed' },
      { field: 'listing.negotiationConditions', before: [], after: ['ACCEPTS_FINANCING'] },
    ])
  })
  it('records only actual changes and ignores technical timestamps and media IDs', () => {
    const after = {
      ...property,
      updatedAt: new Date(),
      media: property.media.map((item) => ({ ...item, id: 'another-id', createdAt: new Date() })),
      title: 'New title',
      values: { ...property.values, price: 420000 },
    }
    expect(propertyHistoryChanges(property, after, refs, refs)).toEqual([
      { field: 'title', before: 'House', after: 'New title' },
      { field: 'price', before: 400000, after: 420000 },
    ])
  })
  it('preserves removed values and the complete address and media order', () => {
    const after = {
      ...property,
      description: 'New text',
      address: { ...property.address!, number: '2' },
      media: [
        { ...property.media[0], url: '/new-cover.jpg' },
        { ...property.media[0], position: 1 },
      ],
    }
    const changes = propertyHistoryChanges(property, after, refs, refs)
    expect(changes).toContainEqual({ field: 'description', before: null, after: 'New text' })
    expect(changes.find((item) => item.field === 'address')?.after).toMatchObject({ number: '2' })
    expect(changes.find((item) => item.field === 'media')?.after).toEqual([
      { url: '/new-cover.jpg', type: 'photo', position: 0 },
      { url: '/photo.jpg', type: 'photo', position: 1 },
    ])
    expect(
      propertyHistoryChanges(
        { ...property, description: 'Old text' },
        { ...property, description: null },
        refs,
        refs,
      ),
    ).toContainEqual({ field: 'description', before: 'Old text', after: null })
  })
  it('keeps reference identities distinct even when two owners have the same name', () => {
    const changes = propertyHistoryChanges(
      { ...property, ownerId: 'one' },
      { ...property, ownerId: 'two' },
      { ownerName: 'Maria' },
      { ownerName: 'Maria' },
    )
    expect(changes).toEqual([
      { field: 'owner', before: { id: 'one', name: 'Maria' }, after: { id: 'two', name: 'Maria' } },
    ])
  })
  it('does not invent an earlier snapshot on creation or changes for unchanged values', () => {
    expect(propertyHistoryChanges(property, property, refs, refs)).toEqual([])
    const changes = propertyHistoryChanges(null, property, refs, refs)
    expect(changes.every((change) => change.before === null)).toBe(true)
  })
})
