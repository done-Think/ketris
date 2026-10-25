export interface RegistrationPasswordHasher {
  hash(password: string): Promise<string>
}
