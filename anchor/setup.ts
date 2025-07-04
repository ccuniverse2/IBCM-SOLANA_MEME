import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  TokenAmount,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { IdlAccounts, Program } from '@coral-xyz/anchor'
import { SignerWalletAdapterProps, WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

import solanaTokenFinanceIdlJson from './solana_token_financing.json'
import type { SolanaTokenFinancing } from './solana_token_financing'

export const connection = new Connection(
  clusterApiUrl(WalletAdapterNetwork.Devnet),
  // 'http://localhost:8899',
  'confirmed'
)

// ---------------------------------------------------------------------------------------------

export const program = new Program(solanaTokenFinanceIdlJson as SolanaTokenFinancing, { connection })

export const MINT_TOKEN_DECIMALS: number = 2
export const USDC_TOKEN_DECIMALS: number = 6


export const NEMEOS_PUBKEY = new PublicKey('BGQnSsvfJmE7cffKZnzze7UprYUPM1ng9rMA26KvqjFH')
export const USDC_PUBKEY = new PublicKey('BGQnSsvfJmE7cffKZnzze7UprYUPM1ng9rMA26KvqjFH')
export const MINT_PUBKEY = new PublicKey('AmjcRH341ppCZmCzvdHVf3z1NwL3pAAKvqJGPHbLJKRf')

export type TokenAccountOwnerPdaData = IdlAccounts<SolanaTokenFinancing>['tokenAccountOwnerPda']
export type VaultAccountData = IdlAccounts<SolanaTokenFinancing>['vaultAccount']
export type LoanAccountData = IdlAccounts<SolanaTokenFinancing>['loanAccount']

export const [vaultAccountPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('nemeos_vault_account'), MINT_PUBKEY.toBuffer()],
  program.programId
)

export async function fetchAccountTokenAmount(publicKey: PublicKey, mintKey: PublicKey, connection: Connection) {
  // Derive the associated token account address for the user
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mintKey, // Token mint address
    publicKey, // Owner of the token account
    false,
    TOKEN_PROGRAM_ID
  )

  try {
    const tokenAccountBalance = await connection.getTokenAccountBalance(associatedTokenAddress)
    return tokenAccountBalance.value
  } catch {
    return null
  }
}

export async function fetchAccountUsdcAmount(publicKey: PublicKey, connection: Connection) {
  return fetchAccountTokenAmount(publicKey, USDC_PUBKEY, connection)
}

export async function fetchWalletBalances(publicKey: PublicKey, connection: Connection) {
  const balanceSol = await connection.getBalance(publicKey)
  const balanceAmountUsdc = await fetchAccountUsdcAmount(publicKey, connection)
  // const balanceAmountMintToken = await fetchAccountTokenAmount(publicKey, MINT_PUBKEY, connection)

  let borrowerTokenInfo: RpcResponseAndContext<TokenAmount> | null = null
  try {
    const [borrowerTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('nemeos_borrower_token_account'), MINT_PUBKEY.toBuffer(), publicKey.toBuffer()],
      program.programId
    )
    borrowerTokenInfo = await connection.getTokenAccountBalance(borrowerTokenAccount)
  } catch (error) {
    console.error('Could not fetch borrower token account:', error)
  }

  const balances = {
    balanceSol,
    balanceSolDisplayString: balanceSol / LAMPORTS_PER_SOL,
    balanceAmountUsdc,
    balanceUsdcDisplayString: balanceAmountUsdc?.uiAmount || 0,
    // balanceAmountMintToken,
    // balanceMintTokenDisplayString: balanceAmountMintToken?.uiAmount || 0,
    balanceAmountMintTokenBorrowerAmount: borrowerTokenInfo?.value.amount,
    balanceAmountMintTokenBorrowerDisplayString: borrowerTokenInfo?.value?.uiAmount || 0,
  }
  console.log(
    `Balances of wallet: ` +
      `${balances.balanceSolDisplayString} SOL, ` +
      `${balances.balanceUsdcDisplayString} USDC, ` +
      `${balances.balanceAmountMintTokenBorrowerDisplayString} MINT`
  )
  return balances
}

export async function getUserTokenAccountOrGetCreationTransactionInstruction(
  publicKey: PublicKey,
  mintKey: PublicKey,
  connection: Connection
): Promise<{
  associatedTokenAddress: PublicKey
  alreadyExists: boolean
  createAssociatedTokenAccountInstruction?: TransactionInstruction
}> {
  try {
    console.log('Creating or getting user token account')

    // Derive the associated token account address for the user
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintKey, // Token mint address
      publicKey, // Owner of the token account
      false,
      TOKEN_PROGRAM_ID
    )

    if (!(await connection.getAccountInfo(associatedTokenAddress))) {
      console.log('Associated token account does not exist yet, need to create it:', associatedTokenAddress.toBase58())
      return {
        associatedTokenAddress,
        alreadyExists: false,
        createAssociatedTokenAccountInstruction: createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAddress,
          publicKey,
          mintKey
        ),
      }
    }

    console.log('Associated token account already exists:', associatedTokenAddress.toBase58())
    return {
      associatedTokenAddress,
      alreadyExists: true,
    }
  } catch (error) {
    console.error('Failed to create or get token account:', error)
    throw error
  }
}

export async function configureAndSendTransaction(
  transaction: Transaction,
  connection: Connection,
  feePayer: PublicKey,
  signTransaction: SignerWalletAdapterProps['signTransaction']
) {
  const blockHash = await connection.getLatestBlockhash()
  transaction.feePayer = feePayer
  transaction.recentBlockhash = blockHash.blockhash
  const signed = await signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())
  await connection.confirmTransaction({
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
    signature,
  })
  return signature
}

export function getNemeosUsdcAccount() {
  return getAssociatedTokenAddress(USDC_PUBKEY, NEMEOS_PUBKEY, false, TOKEN_PROGRAM_ID)
}
