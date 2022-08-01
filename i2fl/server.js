const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const LuccaService = require("./i2fl_folders/services/luccaService");
const Helper = require("./i2fl_folders/helper/Helper")
const FitnetManagerService = require("./i2fl_folders/services/fitnetManagerService");
const express = require('express')
const app = express()
var _ = require('underscore')._;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
LeaveType = StaticValues.LEAVE_TYPE;

async function updateLeaves(user) {
    var map = new Map();
    leaves = await getAcceptedLuccaLeaves(user);
    map = leaves[0]
    src = leaves[1]
    src.sort(function (a, b) {
        return new Date(a) - new Date(b)
    })
    //get leave objects
    const ACPT_LUCCA_LEAVES = src.reduce((res, date, idx, self) => {
        const rangeStart = !idx || new Date(date) - new Date(self[idx - 1]) > (864e5 / 2),
            rangeEnd = idx == self.length - 1 || new Date(self[idx + 1]) - new Date(date) > (864e5 / 2)
        if (rangeStart) res.push({ startDate: date, endDate: date })
        else if (rangeEnd) res[res.length - 1]['endDate'] = date
        return res
    }, []);
    ACPT_LUCCA_LEAVES_trans = await transform(ACPT_LUCCA_LEAVES, StaticValues.IsLuccaFormat, map);
    console.log("ACPT_LUCCA_LEAVES_trans", ACPT_LUCCA_LEAVES_trans);

/*
    const FITNET_LEAVES = await getFitnetLeaves();
    FITNET_LEAVES_trans = await transform(FITNET_LEAVES, StaticValues.IsFitnetFormat, null);


    identical = _.isEqual(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans);

    if (!identical) {
        //first we need to delete the leaves
        let idsToDelete = []
        oldLeavesToDelete = difference(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans)
        idsToDelete = await getIdsToDelete(oldLeavesToDelete, FITNET_LEAVES);
        await deleteLeaves(idsToDelete);
        console.log("after the delete functions,");

        //ONCE WE FINISH deleting the leaves, we start adding the new ones
        newLeavesToAdd = difference(ACPT_LUCCA_LEAVES_trans, FITNET_LEAVES_trans)
        addLeaves(newLeavesToAdd)
    }
    else {
        console.log("ils sont identhey are identicalticals");
    }
*/
}


async function getIdsToDelete(arr, FITNET_LEAVES) {
    let tempArray = []
    await arr.forEach(toDeleteLeave => {
        FITNET_LEAVES.find((o, i) => {
            if (
                (Date.parse(o.beginDate) === Date.parse(toDeleteLeave.startDate))
                &&
                (Date.parse(o.endDate) === Date.parse(toDeleteLeave.endDate))
                &&
                (o.startMidday == toDeleteLeave.isMidDay)
                &&
                (o.endMidday == toDeleteLeave.isEndDay)
            ) {
                tempArray.push(o.leaveId)
            }
        })
    })
    return tempArray;
}

async function addLeaves(arr) {
    for (const luccaLeave of arr) {
        await new Promise(r => addLuccaLeave(luccaLeave, r));
    }
}
function addLuccaLeave(luccaLeave, r) {
    let luccaLeaveToFitnet = {
        "employeeId": 1583,
        "employee": "",
        "email": "siraj.berry@idento.fr",
        "typeId": StaticValues.LEAVE_TYPE,
        "beginDate": luccaLeave.startDate,
        "endDate": luccaLeave.endDate,
        "startMidday": luccaLeave.isMidDay,
        "endMidday": luccaLeave.isEndDay
    }
    setTimeout(() => {
        console.log("user added successfully", luccaLeaveToFitnet);
    }, 2000);
    // FitnetManagerService.fitnetPostLeave(luccaLeaveToFitnet)
    r();
}
async function deleteLeaves(ids) { // create a promise for this to be able to use then()
    for (const id of ids) {
        await new Promise(r => fitnetDeleteLeave(id, r));
    }
}
function fitnetDeleteLeave(id, r) {
    setTimeout(() => {
        console.log("id deleted", id);
        // FitnetManagerService.fitnetDeleteLeave(id);
        r();
    }, 2000);
}

//first function to execute
async function initialize() {
    var users = await getUsers();
    for (const user of users?.data?.items) {
        if (user.id == 1583) {// only for testing 
            await new Promise(r => integrator(user, r));
        }
    }
    console.log('finished looping');
    // updateLeaves();


    // const src = ["2022-08-08T12:00:00","2022-08-08T00:00:00","2022-08-09T12:00:00","2022-08-09T00:00:00","2022-08-10T12:00:00","2022-08-10T00:00:00", "2022-08-12T00:00:00"]
    const src = [
        "2022-08-08T12:00:00",
        "2022-08-08T00:00:00",
        "2022-08-09T12:00:00",
        "2022-08-09T00:00:00",
        "2022-08-10T12:00:00",
        "2022-08-10T00:00:00",
        "2022-08-12T00:00:00"
    ]
    // create a map to get the isMidDay, is endDay
}

async function integrator(user, r) {

    //just test it now on siraj: id 1583
    let userMail = await getUserMail(user.url);
    console.log("usermail ", userMail.data.login, userMail.data.mail); // to be used in the mail property 
    await updateLeaves(user);
    console.log('i waited until we got out of the if statment');
    r();
}
function getUserMail(url) {
    return LuccaService.getURL(url).then(response => response.json());
}
function getUsers() {
    return LuccaService.getUsers().then(response => response.json());
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
})

//functions
//***************/
async function getLuccaLeavesFun(minDate, maxDate, ownerId) {
    let items;
    dateParamParent = 'between,' + minDate + ',' + maxDate;
    getLuccaLeavesProm = LuccaService.getLeavesAPI(ownerId, dateParamParent, StaticValues.PAGING).then(response => response.json());
    getConfirmedLuccaLeaves = await getLuccaLeavesProm.then(l => {
        items = l?.data?.items;
    })
    return items;
}
async function getAcceptedLuccaLeaves(user) {
    console.log("user printed in fun getAcceptedLuccaLeaves", user);
    minDate = '2022-08-01';
    maxDate = '2022-09-30';
    var items = getLuccaLeavesFun(minDate, maxDate, user.id);
    var tempLeaves = []
    await items.then(re => {
        tempLeaves = re;
    });
    finalResultArray = await getConfirmedLuccaLeavesFun(tempLeaves)
    return [finalResultArray[0], finalResultArray[1]];
}
async function getConfirmedLuccaLeavesFun(array) {
    let unsortedAcceptedDates = []
    j = 0;
    const map = new Map();
    // let AM_PM = [];
    let AM_PM = new Set();
    while (array && j < array.length) {
        let t = array[j];
        aURL = await LuccaService.getURL(t.url).then(response => response.json());
        url = aURL.data.leavePeriod.url;
        if (url) {
            tempURL = await LuccaService.getURL(url).then(response => response.json());
            if (tempURL.data.isConfirmed) {
                unsortedAcceptedDates.push(aURL.data.startDateTime)
                
                let tempDate = t.id.split('-')[1]
                if(map.get(tempDate)==null){
                    map.set(tempDate, t.id.split('-')[2])
                }
                else {
                    AM_PM.add(map.get(tempDate));
                    AM_PM.add(t.id.split('-')[2])
                    map.set(tempDate, AM_PM)
                }
            }
        }
        j++;
    }
    AM_PM = []
    return [map, unsortedAcceptedDates];
}
async function getFitnetLeaves() {
    fitnet_Leaves = await FitnetManagerService.fitnetGetLeave(StaticValues.COMPANY_ID, 8, 2022).then(response => response.json());
    return fitnet_Leaves;
}
async function transform(array, isType,map) {
    console.log("map", map);
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
            let luccaStartDate_luccaFormat = luccaTempDate.startDate.split('T')[0];//ex: 2022-08-08
            let luccaEndDate_luccaFormat = luccaTempDate.startDate.split('T')[0];//ex: 2022-08-08

            let luccaIsMidDay = (map.get(luccaStartDate_luccaFormat).length!=2 && map.get(luccaStartDate_luccaFormat).includes('AM'))?true:false;
            let luccaIsEndDay = (map.get(luccaStartDate_luccaFormat).length!=2 && map.get(luccaStartDate_luccaFormat).includes('PM'))?true:false;

            let luccaStartDate_fitnetFormat = Helper.transformToDateFormat(luccaStartDate_luccaFormat);//ex: 2022-08-08
            let luccaEndDate_fitnetFormat = Helper.transformToDateFormat(luccaEndDate_luccaFormat);//ex: 2022-08-08
            console.log("array at index", luccaTempDate);

            integratorFormat = {
                startDate: luccaStartDate_fitnetFormat,
                endDate: luccaEndDate_fitnetFormat,
                isMidDay: luccaIsMidDay,
                isEndDay: luccaIsEndDay,
            }
        }
        await commonFormatArray.push(integratorFormat)
        index++;
    }
    return commonFormatArray;
}

var difference = function (array) {
    var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
    var containsEquals = function (obj, target) {
        if (obj == null) return false;
        return _.any(obj, function (value) {
            return _.isEqual(value, target);
        });
    };
    return _.filter(array, function (value) { return !containsEquals(rest, value); });
};