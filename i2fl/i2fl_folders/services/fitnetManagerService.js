const fetch = require("node-fetch-commonjs");
const StaticValues = require('../enums/StaticValues.enum')


async function fitnetDeleteLeave(id) {
    const response = await fetch("https://evaluation.fitnetmanager.com/FitnetManager/rest/leaves/delete/" + id, {
        method: 'delete',
        headers: {
            authorization: StaticValues.FITNET_ACESS_TOKEN

            // Authorization: StaticValues.FITNET_ACESS_TOKEN
        },
    });
    return response;
}
async function fitnetGetLeave(companyId, month, year) {
    const response = await fetch("https://evaluation.fitnetmanager.com/FitnetManager/rest/leaves/getLeavesWithRepartition/" + companyId + "/" + month + "/" + year, {
        method: 'get',
        headers: {
            Authorization: StaticValues.FITNET_ACESS_TOKEN
        },
    });
    return response;
}

module.exports = { fitnetGetLeave, fitnetDeleteLeave };
