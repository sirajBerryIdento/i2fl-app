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

function getURL(url) {
    const response = fetch(url, {
        method: 'get',
        headers: {
            Authorization: StaticValues.LUCCA_ACCESS_TOKEN
        },
    });
    return response;
}
module.exports = { getLeavesAPI, getURL };


// leaves?.data?.items.forEach(leave => {
//     getIfConfirmed = LuccaService.getURL(leave?.url);
//     getIfConfirmed
//         .then(resp => {
//             LuccaService.getURL(resp.data.leavePeriod.url)
                
//                 .then(
//                     r => {
//                         if (r.data.isConfirmed) {
//                             console.log('inside');
//                             acceptedLuccaLeaves.push(leave)// the whole object
//                         }
//                     }
//                 )
//         });
// })