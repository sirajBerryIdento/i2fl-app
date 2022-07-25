const fetch = require("node-fetch-commonjs");
const StaticValues = require('../enums/StaticValues.enum')

async function getLeavesAPI(ownerId, date, paging) {
    const response = await fetch('https://i-tracing.ilucca-test.net/api/v3/leaves?leavePeriod.ownerId=' + ownerId + '&date=' + date + '&paging=' + paging, {
        method: 'get',
        headers: {
            Authorization: StaticValues.LUCCA_ACCESS_TOKEN
        },
    });
    return response;
}


module.exports = { getLeavesAPI };
