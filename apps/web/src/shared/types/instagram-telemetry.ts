export type PrivacyFilter<T> = (item: T) => T | null

export type InstagramTelemetryFilters<Event, Transaction, Breadcrumb, Log> = {
  beforeSend: PrivacyFilter<Event>
  beforeSendTransaction: PrivacyFilter<Transaction>
  beforeBreadcrumb: PrivacyFilter<Breadcrumb>
  beforeSendLog: PrivacyFilter<Log>
}
