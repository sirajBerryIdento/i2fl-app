const fetch = require("node-fetch-commonjs");
const StaticValues = require('../enums/StaticValues.enum')

async function getLeavesAPI(ownerId, date, paging) {
    const response = await fetch(StaticValues.URL_Lucca + '/api/v3/leaves?leavePeriod.ownerId=' + ownerId + '&date=' + date + '&paging=' + paging, {
        method: 'get',
        headers: {
            Authorization: StaticValues.LUCCA_ACCESS_TOKEN
        },
    });
    return response;
}

function getURL(url) {
    const response = fetch(url, {
        method: 'get',
        headers: {
            Authorization: StaticValues.LUCCA_ACCESS_TOKEN
        },
    });
    return response;
}


function getUsers(url) {// check if it is better to get only the email, use id, url instead of all the fields
    const response = fetch(StaticValues.URL_Lucca + '/api/v3/users?fields=id,firstName,lastName,mail,login,personalEmail', {
        method: 'get',
        headers: {
            Authorization: StaticValues.LUCCA_ACCESS_TOKEN
        },
    });
    return response;
}
module.exports = { getLeavesAPI, getURL, getUsers };