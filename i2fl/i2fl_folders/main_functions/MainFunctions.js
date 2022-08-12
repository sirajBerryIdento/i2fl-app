const Helper = require("../helper/Helper")
const FitnetManagerService = require("../services/fitnetManagerService");
const LuccaService = require("../services/luccaService");
const StaticValues = require('../enums/StaticValues.enum')

var _ = require('underscore')._;

async function getLuccaLeavesFun(ownerId, month, year) {
    let items;
    endOfMonth = new Date(year, month, 0).getDate();
    reshapedendOfMonth= ((endOfMonth > 9) ? endOfMonth : '0' + endOfMonth)
    dateParamParent = "until,"+ year+'-'+month+'-'+endOfMonth;// '2021-01-31'
    // dateParamParent = 'between,' + minDate + ',' + maxDate;
    getLuccaLeavesProm = LuccaService.getLeavesAPI(ownerId, dateParamParent, StaticValues.PAGING).then(response => response.json());
    getConfirmedLuccaLeaves = await getLuccaLeavesProm.then(l => {
        items = l?.data?.items;
    })
    return items;
}


async function getAcceptedLuccaLeaves(user, month, year) {
    var items = getLuccaLeavesFun(user.id, month, year);
    var tempLeaves = []
    await items.then(re => {
        tempLeaves = re;
    });
    finalResultArray = await getConfirmedLuccaLeavesFun(tempLeaves)
    return [finalResultArray[0], finalResultArray[1]];
}
async function getConfirmedLuccaLeavesFun(array) {
    creationDate = StaticValues.STARTING_DATE_LIVE_LUCCA

    let unsortedAcceptedDates = []
    j = 0;
    const map = new Map();
    let AM_PM = new Set();
    while (array && j < array.length) {
        let t = array[j];
        aURL = await LuccaService.getURL(t.url).then(response => response.json());
        // console.log(aURL.data);
        if (
            new Date( aURL.data.creationDate)>new Date(creationDate) // this is important to avoid deleting leaves created before the deployment of i2fl
                
        ) 
        {
            url = aURL.data.leavePeriod.url;
            if (url) {
                tempURL = await LuccaService.getURL(url).then(response => response.json());
                if (tempURL.data.isConfirmed) {
                    unsortedAcceptedDates.push(aURL.data.startDateTime)
    
                    let tempDate = Helper.toLuccaDateFormate(Helper.getDateFromString(t.id, "-", 1));
                    if (map.get(tempDate) == null) {
                        map.set(tempDate, Helper.getDateFromString(t.id, "-", 2))
                    }
                    else {
                        AM_PM.add(map.get(tempDate));
                        AM_PM.add(Helper.getDateFromString(t.id, "-", 2))
                        map.set(tempDate, AM_PM)
                    }
                }
            }
        }
        j++;
    }
    AM_PM = []
    return [map, unsortedAcceptedDates];
}
async function getFitnetLeaves(month, year) {
    fitnet_Leaves = await FitnetManagerService.fitnetGetLeave(StaticValues.COMPANY_ID, month, year).then(response => response.json());
    return fitnet_Leaves;
}
async function transform(array, isType, map) {
    let index = 0;
    commonFormatArray = [];
    while (index < array.length) {
        let integratorFormat = {}
        temp = array[index];
        if (isType == 0) {//Fitnet
            integratorFormat = {
                startDate: temp.beginDate,
                endDate: temp.endDate,
                isMidDay: temp.startMidday,
                isEndDay: temp.endMidday,
            }
        }
        else if (isType == 1) {//lucca
            let luccaTempDate = array[index];//ex: 2022-08-08T00:00:00 
            let luccaStartDate_luccaFormat = Helper.getDateFromString(luccaTempDate.startDate, 'T', 0);//ex: 2022-08-08
            let luccaEndDate_luccaFormat = Helper.getDateFromString(luccaTempDate.endDate, 'T', 0);//ex: 2022-08-08
            let luccaIsMidDay = (map.get(luccaStartDate_luccaFormat).size != 2 && map.get(luccaStartDate_luccaFormat).includes('AM')) ? true : false;
            let luccaIsEndDay = (map.get(luccaStartDate_luccaFormat).size != 2 && map.get(luccaStartDate_luccaFormat).includes('PM')) ? true : false;

            let luccaStartDate_fitnetFormat = Helper.transformToDateFormat(luccaStartDate_luccaFormat);//ex: 2022-08-08
            let luccaEndDate_fitnetFormat = Helper.transformToDateFormat(luccaEndDate_luccaFormat);//ex: 2022-08-08

            integratorFormat = {
                startDate: Helper.luccaToFitnetDateConvertor(luccaStartDate_fitnetFormat),
                endDate: Helper.luccaToFitnetDateConvertor(luccaEndDate_fitnetFormat),
                isMidDay: luccaIsMidDay,
                isEndDay: luccaIsEndDay,
            }
        }
        await commonFormatArray.push(integratorFormat)
        index++;
    }
    return commonFormatArray;
}
function difference(array) {
    var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
    var containsEquals = function (obj, target) {
        if (obj == null) return false;
        return _.any(obj, function (value) {
            return _.isEqual(value, target);
        });
    };
    return _.filter(array, function (value) { return !containsEquals(rest, value); });
};



module.exports = { getLuccaLeavesFun, getAcceptedLuccaLeaves, getConfirmedLuccaLeavesFun, getFitnetLeaves, transform, difference};
