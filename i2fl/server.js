const FitnetLeave = require('./i2fl_folders/_models/Fitnet.model')
const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const Helper = require("./i2fl_folders/helper/Helper");
const LuccaService = require("./i2fl_folders/services/luccaService");
const FitnetManagerService = require("./i2fl_folders/services/fitnetManagerService");
const express = require('express')
const app = express()
const fetch = require("node-fetch-commonjs");

var _ = require('underscore')._;

var getLuccaLeaves = null;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

LeaveType = StaticValues.LEAVE_TYPE;

var startDate = '2022-07-27';
var endDate = '2022-11-27';
const INDEX = "\\Index.html";
app.get('/', function (req, res) {
    res.send(__dirname + INDEX);
})


var dateParam, dateStart, dateEnd, isCancelled;
app.post('/integrate', function (req, res) {
    payload = res.req.body;
    ownerId = payload.owner.id;
    email = "siraj.berry@idento.fr";

    isCancelled = payload.isCancelled;

    if (dateStart === '') {
        dateStart = res.req.body.date;
    }
    dateEnd = res.req.body.date;
    dateParam = 'between,' + dateStart + ',' + dateEnd;
    res.json(res.req.body)
})

function callback() {
    setTimeout(() => {
        if (isCancelled) { // user wants to delete a vacation
            deleteLeave(dateStart);
        }
        else { // user is adding a vacation
            getLuccaLeaves = LuccaService.getLeavesAPI(ownerId, dateParam, StaticValues.PAGING);
            getLuccaLeaves.then(response => response.json())
                .then(leaves => {
                    if (leaves) {
                        luccaLeaves = leaves?.data?.items;
                        integrator(luccaLeaves, email);
                    }
                })
        }
    }, 0);
}
function reInitializeVariables() {
    dateStart = '';
    dateEnd = '';
    dateParam = '';

}
//first function to execute
function initialize() {
    reInitializeVariables();
    setInterval(() => {
        if (!(dateParam === '')) {
            callback();
        }
        else {
            console.log('dateParam still empty', dateParam);
        }
    }, StaticValues.CALLBACK_INTERVAL);




    var ACPT_LUCCA_LEAVES = getAcceptedLuccaLeaves();
    ACPT_LUCCA_LEAVES_trans = transform(ACPT_LUCCA_LEAVES)
    var FITNET_LEAVES = getFitnetLeaves();
    FITNET_LEAVES_trans = transform(FITNET_LEAVES); 
    identical = _.isEqual(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans);
    if(!identical) {
        newLeavesToAdd = _.difference(ACPT_LUCCA_LEAVES_trans,FITNET_LEAVES_trans)
        oldLeavesToDelete = _.difference(FITNET_LEAVES_trans,ACPT_LUCCA_LEAVES_trans)

        deleteLeaves(oldLeavesToDelete).then(
            addLeaves(newLeavesToAdd)
        )

      
    }
}

function addLeaves() {
    index_add = 0;
    while(index_add<oldLeavesToDelete.length()) {
        let tempLeave = oldLeavesToDelete[index_add];
        tempLeaveToFitnet = transformToFitnetObj(tempLeave)
        FitnetManagerService.setLeaves(tempLeaveToFitnet).then(
            ()=>{
                index_add++;
            }
        )
    }
}
function deleteLeaves(oldLeavesToDelete) { // create a promise for this to be able to use then()
    index_delete = 0;
    while(index_delete<oldLeavesToDelete.length()) {
        let tempLeave = oldLeavesToDelete[index_delete];
        tempLeaveToFitnet = transformToFitnetObj(tempLeave)
        FitnetManagerService.deleteLeave(tempLeaveToFitnet).then(
            ()=>{
                index_delete++;
            }
        )
    }
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
    console.log("integrator server listening at 8088")
})

//functions
function integrator(luccaLeaves, email) {
    //case of half day
    if (luccaLeaves.length == 1) {
        halfDay = luccaLeaves[0];
        let d = Helper.getDateFromId(halfDay);
        halfDayDate = Helper.transformToDateFormat(d);
        var fitnetLeaveRequest1 = new FitnetLeave(email, LeaveType, halfDayDate, halfDayDate, Helper.isAm(halfDay.id), !Helper.isAm(halfDay.id))
        setLeaves(fitnetLeaveRequest1);
    }
    // case of full day
    else if (luccaLeaves.length == 2) {
        fullDay = luccaLeaves[0];

        let fd = Helper.getDateFromId(fullDay);
        fullDayDate = Helper.transformToDateFormat(fd);
        var fitnetLeaveRequest2 = new FitnetLeave(email, LeaveType, fullDayDate, fullDayDate, false, false);
        setLeaves(fitnetLeaveRequest2);
    }
    else if (luccaLeaves.length > 2) {
        var begin = luccaLeaves[0];
        var end = luccaLeaves[luccaLeaves.length - 1];

        var beginDate = Helper.getDateFromId(begin);
        beginDate = Helper.transformToDateFormat(beginDate);
        var endDate = Helper.getDateFromId(end);
        endDate = Helper.transformToDateFormat(endDate);

        var startMidday = Helper.isHalfDay(luccaLeaves, begin.id);
        var endMidday = Helper.isHalfDay(luccaLeaves, end.id);

        var fitnetLeaveRequest3 = new FitnetLeave(email, LeaveType, beginDate, endDate, startMidday, endMidday);
        setLeaves(fitnetLeaveRequest3);
    }
}

function deleteLeave(dateLeave) {
    splitLeaveDate = dateLeave.split("-");
    var companyId = StaticValues.COMPANY_ID;

    var year = Number(splitLeaveDate[0]);
    var month = Number(splitLeaveDate[1]);
    var day = Number(splitLeaveDate[2]);

    var luccaToFitnetDateFormat = Helper.luccaToFitnetDateConvertor(day, month, year);
    fitnetLeaveObj = FitnetManagerService.fitnetGetLeave(companyId, month, year);
    fitnetLeaveObj.then(response => response.json())
        .then(leaves => {
            if (leaves) {
                leaves.forEach(leave => {
                    console.log("leave: ", leave)
                    if (leave.beginDate === luccaToFitnetDateFormat) {
                        console.log("inside the if statment, id found is: ", leave.leaveId)
                        deleteLeavePromise = FitnetManagerService.fitnetDeleteLeave(leave.leaveId);
                        deleteLeavePromise.then((res) => {
                            console.log("leave request with id " + leave.leaveId + " was deleted successfully")
                            reInitializeVariables();
                        }).catch((error) => {
                            console.log("error: ", error);
                        });
                        console.log("inside")
                    }
                }
                );
            }
        })
    console.log("outside")
}

async function setLeaves(fitnetLeaveRequest) {
    const response = await fetch("https://evaluation.fitnetmanager.com/FitnetManager/rest/leaves/create", {
        method: 'POST',
        headers: {
            'Authorization': StaticValues.FITNET_ACESS_TOKEN,
            'Content-type': 'application/json; charset=UTF-8',

        },
        body: JSON.stringify(fitnetLeaveRequest),
    }).then((res) => {
        if (res.status == 200) {
            console.log("success this leave request was aded to fitnet", fitnetLeaveRequest)
        }
        else if (res.status == 500) {
            console.log("res", res)
        }
        else {
            console.log("res: ", res)
        }
    }).catch(
        (error) => {
            console.log("error: ", error);
        });
    reInitializeVariables();
}



//***************/
function getAcceptedLuccaLeaves() {
    dateParamParent = 'between,' + minDate + ',' + maxDate;
    getLuccaLeaves = LuccaService.getLeavesAPI(ownerId, dateParamParent, StaticValues.PAGING);
    getLuccaLeaves.then(response => response.json())
        .then(leaves => {
            leaves?.data?.items.forEach(leave => {
                getIfConfirmed = LuccaService.getURL(leave?.url);
                getIfConfirmed.then(response => response.json())
                    .then(resp => {
                        LuccaService.getURL(resp.data.leavePeriod.url)
                            .then(response => response.json())
                            .then(
                                r => {
                                    if (r.data.isConfirmed) {
                                        acceptedLeaves.push(leave.id.split('-')[1])
                                    }
                                }
                            )
                    });
            })
        })
        //remove duplicates
        .then(() => {
            acceptedLeaves = acceptedLeaves.filter((thing, index) => {
                const _thing = JSON.stringify(thing);
                return index === acceptedLeaves.findIndex(obj => {
                    return JSON.stringify(obj) === _thing;
                });
            })
        })
        //arrange into consecutive requests
        .then(() => {
            dateformat = StaticValues.dateformat;
            leaveRequestsQueue = acceptedLeaves.reduce(function (acc, val) {
                var present, date = moment(val, dateformat);
                acc.forEach(function (arr, index) {
                    if (present) return;
                    if (arr.indexOf(date.clone().subtract(1, 'day').format(dateformat)) > -1 || arr.indexOf(date.clone().add(1, 'day').format(dateformat)) > -1) {
                        present = true;
                        arr.push(val);
                    }
                });
                if (!present) acc.push([val]);
                return acc;
            }, []);
        })
    return leaveRequestsQueue;
}
function getFitnetLeaves(){
    fitnetLeaves = [];
    FitnetManagerService.fitnetGetLeave(companyId, 7, year).then(response => response.json())
    .then(leaves => {fitnetLeaves = fitnetLeaves.concat(leaves)})

    FitnetManagerService.fitnetGetLeave(companyId, 8, year).then(response => response.json())
    .then(leaves => {fitnetLeaves = fitnetLeaves.concat(leaves)})

    FitnetManagerService.fitnetGetLeave(companyId, 9, year).then(response => response.json())
    .then(leaves => {fitnetLeaves = fitnetLeaves.concat(leaves)})

    FitnetManagerService.fitnetGetLeave(companyId, 10, year).then(response => response.json())
    .then(leaves => {fitnetLeaves = fitnetLeaves.concat(leaves)})

    return fitnetLeaves;
}

function transform(array) {
    tempArray = []
    array.forEach((leave)=>{
        console.log(leave)
    })
}