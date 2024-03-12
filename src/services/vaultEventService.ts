import { logger } from "../utils/logger";
import { EventGraphQL } from "../subgraph/event";
import config from "../config/default";

// const arbitrumGraphQL: EventGraphQL = new EventGraphQL(config.subgraph.arbitrum);
const zksyncEraGraphQL: EventGraphQL = new EventGraphQL(config.subgraph.zksync);

export async function getVaultEventUserData(
  address: string,
  startDateStr = "2023-08-01",
  endDateStr = "2023-10-26"
) {
  const data = await zksyncEraGraphQL.getVaultDepositUser(address);
  if (!data.hasOwnProperty("trader")) {
    return [];
  }

  const { trader } = data;

  const dailyDeposit = makeDailyDeposit(trader, startDateStr, endDateStr);

  const { staking1Deposit, staking2Deposit } = calcStakingDeposit(
    deepCopy(dailyDeposit),
    startDateStr,
    endDateStr
  );

  return { staking1Deposit, staking2Deposit, dailyDeposit };
}

export async function getVaultEventUserList(
  startDateStr = "2023-08-01",
  endDateStr = "2023-10-26",
  isCsv = false
) {
  const ret = {};
  const depositData = await getVaultDepositUserList(startDateStr, endDateStr);

  const retCSV: string[] = [];
  for (let address of Object.keys(depositData)) {
    let data = depositData[address];

    const { staking1Deposit, staking2Deposit } = calcStakingDeposit(
      data,
      startDateStr,
      endDateStr
    );

    if (staking1Deposit > 0) {
      if (isCsv) {
        retCSV.push(`${address},${staking1Deposit},${staking2Deposit}`);
      } else {
        ret[address] = { staking1Deposit, staking2Deposit };
      }
    }
  }
  if (isCsv) {
    return "address,staking1Deposit,staking2Deposit\n" + retCSV.join("\n");
  } else {
    return ret;
  }
}

export async function getVaultDepositUserList(
  startDateStr = "2023-08-01",
  endDateStr = "2023-10-26"
) {
  const ret = {};
  const traders = await zksyncEraGraphQL.getVaultDepositUserAll();

  logger.info(`traders count : ${traders.length}`);
  if (traders.length == 0) {
    logger.info(`Number of traders is zero.`);
    return [];
  }

  const depositUsers = traders.filter(
    (trader) => trader?.receiveShares?.length > 0
  ); // traders.slice(0,3);
  logger.info(`depositUsers count : ${depositUsers.length}`);

  for (let user of depositUsers) {
    const address = user.id;
    ret[address] = makeDailyDeposit(user, startDateStr, endDateStr);
  }

  return ret;
}

function makeDailyDeposit(trader, startDateStr: string, endDateStr: string) {
  let ret = {};

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const depositShare = parseInt(trader.depositShare) / Math.pow(10, 6);
  const depositAsset = parseInt(trader.depositAsset) / Math.pow(10, 6);
  const receiveShares = trader.receiveShares;
  const sendShares = trader.sendShares;

  ret = { depositShare, depositAsset };

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const formattedDate = currentDate.toISOString().slice(0, 10);
    ret[formattedDate] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (let receiveShare of receiveShares) {
    const asset = parseInt(receiveShare.asset) / Math.pow(10, 6);
    const timestamp = receiveShare.timestamp;

    let date = timestampStringToDate(timestamp);
    if (!date) {
      continue;
    } else if (date < startDate) {
      date = new Date(startDate);
    }

    // + asset
    while (date <= endDate) {
      const formattedDate = date.toISOString().slice(0, 10);
      ret[formattedDate] += asset;
      date.setDate(date.getDate() + 1);
    }
  }
  for (let sendShare of sendShares) {
    const asset = parseInt(sendShare.asset) / Math.pow(10, 6);
    const timestamp = sendShare.timestamp;

    let date = timestampStringToDate(timestamp);
    if (!date) {
      continue;
    } else if (date < startDate) {
      date = new Date(startDate);
    }

    // - asset
    while (date <= endDate) {
      const formattedDate = date.toISOString().slice(0, 10);
      ret[formattedDate] -= asset;
      date.setDate(date.getDate() + 1);
    }
  }
  return ret;
}

function calcStakingDeposit(
  dailyDepositData,
  startDateStr: string,
  endDateStr: string
) {
  const endDate = new Date(endDateStr);

  const staking1day = 10 * 7;
  const staking2day = 12 * 7;

  let stakingDay = 0;
  let deposit = 0;
  let staking1Deposit = 0; // staking 10 weeks
  let staking2Deposit = 0; // staking 12 weeks

  let currentDate = new Date(startDateStr);
  while (currentDate <= endDate) {
    const formattedDate = currentDate.toISOString().slice(0, 10);

    // console.log(address, formattedDate, data[formattedDate])
    if (dailyDepositData[formattedDate] > 0 && deposit == 0) {
      deposit = dailyDepositData[formattedDate];
      stakingDay = 0;
    }
    if (deposit > 0) {
      let tempDate = new Date(currentDate);
      while (tempDate <= endDate) {
        const tempFormattedDate = tempDate.toISOString().slice(0, 10);
        if (dailyDepositData[tempFormattedDate] - deposit < 0) {
          break;
        }
        dailyDepositData[tempFormattedDate] -= deposit;
        tempDate.setDate(tempDate.getDate() + 1);
        stakingDay += 1;
        if (stakingDay >= staking2day) {
          break;
        }
      }
      console.log(deposit, stakingDay);

      if (stakingDay >= staking1day) {
        staking1Deposit += deposit;
      }
      if (stakingDay >= staking2day) {
        staking2Deposit += deposit;
      }
      deposit = 0;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
  return { staking1Deposit, staking2Deposit };
}

function timestampStringToDate(timestamp: string): Date | null {
  const timestampInt = parseInt(timestamp, 10);

  if (isNaN(timestampInt)) {
    return null;
  }

  return new Date(timestampInt * 1000); // Convert to milliseconds
}

function deepCopy(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj);
  }

  if (Array.isArray(obj)) {
    const copyArray: any = [];
    for (let i = 0; i < obj.length; i++) {
      copyArray[i] = deepCopy(obj[i]);
    }
    return copyArray;
  }

  const copyObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copyObj[key] = deepCopy(obj[key]);
    }
  }
  return copyObj;
}
