const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const LuccaService = require("./i2fl_folders/services/luccaService");
const FitnetManagerService = require("./i2fl_folders/services/fitnetManagerService");
const express = require('express')
const app = express()
var _ = require('underscore')._;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
LeaveType = StaticValues.LEAVE_TYPE;

async function integrator() {
    const ACPT_LUCCA_LEAVES = await getAcceptedLuccaLeaves();
    // ACPT_LUCCA_LEAVES_trans = [
    //     {
    //         startDate: '16/08/2022',
    //         endDate: '16/08/2022',
    //         isMidDay: false,
    //         isEndDay: false
    //     },
    //     {
    //         startDate: '13/08/2022',
    //         endDate: '13/08/2022',
    //         isMidDay: false,
    //         isEndDay: false
    //     }
    // ];
    console.log("ACPT_LUCCA_LEAVES", ACPT_LUCCA_LEAVES);
    ACPT_LUCCA_LEAVES_trans = await transform(ACPT_LUCCA_LEAVES, StaticValues.IsLuccaFormat);
    console.log("ACPT_LUCCA_LEAVES_trans",ACPT_LUCCA_LEAVES_trans);
    /*
    const FITNET_LEAVES = await getFitnetLeaves();
    FITNET_LEAVES_trans = await transform(FITNET_LEAVES, StaticValues.IsFitnetFormat);

    
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
    }*/
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
function initialize() {
    integrator();
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
})

//functions
//***************/
async function getLuccaLeavesFun(minDate, maxDate) {
    let items;
    dateParamParent = 'between,' + minDate + ',' + maxDate;
    getLuccaLeavesProm = LuccaService.getLeavesAPI(ownerId, dateParamParent, StaticValues.PAGING).then(response => response.json());
    getConfirmedLuccaLeaves = await getLuccaLeavesProm.then(l => {
        items = l?.data?.items;
    })
    return items;
}
async function getAcceptedLuccaLeaves() {
    minDate = '2022-08-01';
    maxDate = '2022-08-31';
    finalResult = []
    ownerId = 1583
    var items = getLuccaLeavesFun(minDate, maxDate);
    var tempLeaves = []
    await items.then(re => {
        tempLeaves = re;
    });
    finalResult = await getConfirmedLuccaLeavesFun(tempLeaves)
    return finalResult;
}
async function getConfirmedLuccaLeavesFun(array) {
    j = 0;
    returned = []
    while (array && j < array.length) {
        let t = array[j];
        aURL = await LuccaService.getURL(t.url).then(response => response.json());
        url = aURL.data.leavePeriod.url;
        if (url) {
            tempURL = await LuccaService.getURL(url).then(response => response.json());
            if (tempURL.data.isConfirmed) {
                returned.push(t);
            }
        }
        j++;
    }
    return returned;
}
async function getFitnetLeaves() {
    fitnet_Leaves = await FitnetManagerService.fitnetGetLeave(StaticValues.COMPANY_ID, 8, 2022).then(response => response.json());
    return fitnet_Leaves;
}
async function transform(array, isType) {
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
            console.log("array at index",array[index]);
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