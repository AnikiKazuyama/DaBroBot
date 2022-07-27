import axios from 'axios';

const headers = {
  'Content-Type': 'application/json',
  'x-application-name': 'desktop',
  'x-api-cred': ''
}

export const login = (login, password) => {

  var config = {
    method: 'post',
    url: 'https://ft20-lsapi2-crm-pay-lb-01.app-ses.com/rest/auth/v1/authenticate',
    headers: {
      'Content-Type': 'application/json',
      'x-application-name': 'desktop',
      'x-api-cred': ''
    },
    data: {
      login,
      password
    }
  };

  return axios(config);
};


export const getUserInfo = (token, number) => {
  return axios({
    method: 'post',
    url: 'https://ft20-lsapi2-crm-pay-lb-01.app-ses.com/rest/auth/v6/getUserInfo',
    headers: {
      'Content-Type': 'application/json',
      'x-application-name': 'desktop',
      'x-api-cred': `|${token}`,
      'x-user': number
    }
  });
}

export const getEventListBySearch = (search) => {
  return axios({
    method: 'post',
    url: 'https://ft20-ldsapi-crm-lb-01.app-ses.com/rest/events/v6/groupingByProposedType',
    headers: {
      'Content-Type': 'application/json',
      'x-application-name': 'desktop'
    },
    data: {
      search
    }
  });
}

