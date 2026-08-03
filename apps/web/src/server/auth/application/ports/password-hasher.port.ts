// Port — permite trocar bcrypt por outro algoritmo (ex.: argon2) sem tocar no use-case (OCP/DIP).
export interface PasswordHasher {
  compare(plainText: string, hash: string): Promise<boolean>
  hash(plainText: string): Promise<string>
}
