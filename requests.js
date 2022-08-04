import axios from 'axios';
import sessionStorage from './sessionStorage.js';

const getCredentialsHeaders = (token, number) => ({
  'x-api-cred': token,
  'x-user': number
})

const getCredentialsHeadersFromStorage = (telegramUserid) => ({ 
  'x-api-cred': sessionStorage.get(telegramUserid)?.token ?? '',
  'x-user': sessionStorage.get(telegramUserid)?.number ?? ''
});

const commonHeaders = {
  'Content-Type': 'application/json', 
  'x-application-name': 'desktop', 
  'x-api-cred': ''
}

const lsLsApiAxios = axios.create({
  baseURL: 'https://ft20-lsapi2-crm-pay-lb-01.app-ses.com/rest/',
  headers: commonHeaders
});

const lsLdsApiAxios = axios.create({
  baseURL: 'https://ft20-ldsapi-crm-lb-01.app-ses.com/rest/',
  headers: commonHeaders
});

export const login = (login, password) => lsLsApiAxios({
  method: 'post',
  url: 'auth/v1/authenticate',
  data : {
    login,
    password
  }
});

export const getBalance = (token, number) => lsLsApiAxios({
  method: 'post',
  url: 'auth/v2/getBalance',
  headers: getCredentialsHeaders(token, number)
});

export const getUserInfo = (token, number) => lsLsApiAxios({
    method: 'post',
    url: 'auth/v6/getUserInfo',
    headers: {
      'Content-Type': 'application/json', 
      'x-application-name': 'desktop', 
      'x-api-cred': `|${token}`,
      'x-user': number
  }
});

export const getEventListBySearch = (search) => lsLdsApiAxios({
  method: 'post',
  url: 'events/v6/groupingByProposedType',
  data: {
    search
  }
});

export const makeBet = (telegramUserid, {amount, factorId, outcomeId}) => {
  const userData = sessionStorage.get(telegramUserid);

  return lsLsApiAxios({
    method: 'post',
    url: 'bets/v3/makeBet',
    headers: getCredentialsHeadersFromStorage(telegramUserid),
    data: {
      accept: "all",
      accountNumber: userData?.wallet?.number,
      accountType: userData?.wallet?.type,
      isDraft: false,
      bets: [
          {
              amount,
              dimension: 1,
              outcomes: [
                  {
                      factorId,
                      outcomeId
                  }
              ]
          }
      ]
    }
  });
}
