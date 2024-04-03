import { JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import { RPC } from "../config/constants";
import { ERC20__factory } from "../typechain";
import { AddressBook } from "../address-book";
import { getTokenCache } from "../cache";

/**
 * @dev get ERC20 token balance of an account
 * @param network target network. e.g., 'mainnet', 'arbitrum'
 * @param token token address to query balance
 * @param account account address to query token balance
 * @returns balance in bigint type
 */
async function _ERC20_BalanceOf(network: keyof typeof RPC, token: string, account: string): Promise<bigint> {
  const cache = getTokenCache();
  const cacheKey = [network, token, account].join("-").toLowerCase();
  const cached = await cache.get(cacheKey);
  if (cached) return BigInt(cached);

  const url = RPC[network];
  const provider = new JsonRpcProvider(url);
  const tokenContract = ERC20__factory.connect(token, provider);
  const balance = await tokenContract.balanceOf(account);
  await cache.set(cacheKey, balance.toString());
  return balance;
}

async function _ERC20_totalSupply(network: keyof typeof RPC, token: string) {
  const url = RPC[network];
  const provider = new JsonRpcProvider(url);
  const tokenContract = ERC20__factory.connect(token, provider);
  const totalSupply = await tokenContract.totalSupply();
  return totalSupply;
}

/**
 * @dev get CNG token balance of an account
 * @param network target network. e.g., 'mainnet', 'arbitrum'
 * @param account account address to query token balance
 * @returns balance in bigint type
 */
async function getCNGBalance(network: keyof typeof RPC, account: string): Promise<bigint> {
  return await _ERC20_BalanceOf(network, AddressBook[network].CNG, account);
}

async function getLockedCNG(): Promise<bigint> {
  const balances = await Promise.all([
    getCNGBalance("mainnet", AddressBook.mainnet.Timelock),
    getCNGBalance("mainnet", AddressBook.mainnet.SwapperVault),
  ]);

  return balances.reduce((acc, cur) => acc + cur, BigInt(0));
}

async function getStakedCNG(): Promise<bigint> {
  return await getCNGBalance("arbitrum", AddressBook.arbitrum.GambitStaking);
}

// TODO: should read ERC20.Transfer(from, to=0x00, value) event logs
// TODO: we may use dune query for this query
async function getBurntCNG(): Promise<bigint> {
  return parseUnits("3883110", 18); // 3,883,110 CNG
}

export async function getTokenAllocation(): Promise<{
  totalSupply: number;
  locked: number;
  staked: number;
  burnt: number;
  circulating: number;
}> {
  const totalSupply = await _ERC20_totalSupply("mainnet", AddressBook.mainnet.CNG);
  const locked = await getLockedCNG();
  const staked = await getStakedCNG();
  const burnt = await getBurntCNG();
  const circulating = totalSupply - locked - staked - burnt;

  return {
    totalSupply: parseFloat(formatUnits(totalSupply, 18)),
    locked: parseFloat(formatUnits(locked, 18)),
    staked: parseFloat(formatUnits(staked, 18)),
    burnt: parseFloat(formatUnits(burnt, 18)),
    circulating: parseFloat(formatUnits(circulating, 18)),
  };
}

if (typeof require !== "undefined" && require.main === module) {
  (async () => {
    console.log(await getTokenAllocation());
  })();
}
