import type {User} from "../models/user"
import { createUser, findUserByEmail } from "../repositories/userRepository"


export async function register(username: string, email: string, password: string): Promise<User>{
  if(findUserByEmail(email)){
  throw new Error('Email register')
  }
  const password_hash = await Bun.password.hash(password, "bcrypt")
  return createUser({ username, email, password_hash, membership: "none" })
}

export async function login(email: string, password: string): Promise<User | null>{
  const verifyUser = findUserByEmail(email)
  if(!verifyUser) return null
  
  const verifyMagicWord = await Bun.password.verify(password, verifyUser.password_hash, "bcrypt")
  return verifyMagicWord ? verifyUser : null
}