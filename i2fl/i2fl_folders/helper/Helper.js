function getDateFromString(data,split_by, index) {
    return data.split(split_by)[index];
}
function transformToDateFormat(date) {// 2022-09-06 to 06-09-2022(dd-mm-yyyy)
    let date_splitted = date.split('-');
    return date_splitted[2]+'-'+date_splitted[1]+'-'+date_splitted[0];
}
function toLuccaDateFormate(date){ //from 20220906 to result: 2022-09-06
    return date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8); 
}
//yyyy-MM-dd to dd/MM/yyyy
function luccaToFitnetDateConvertor(date) {
    let day = parseInt (getDateFromString(date, '-',0)) 
    let month = parseInt(getDateFromString(date, '-',1)) 
    let year = parseInt(getDateFromString(date, '-',2)) 
    return ((day > 9) ? day : '0' + day) + "/" + ((month > 9) ? month : '0' + month) + "/" + year;
}
//dd/MM/yyyy to yyyy-MM-dd
function FitnetToluccaDateConvertor(date) {
    let day = parseInt (getDateFromString(date, '/',0)) 
    let month = parseInt(getDateFromString(date, '/',1)) 
    let year = parseInt(getDateFromString(date, '/',2)) 
    return year+ "-" + ((month > 9) ? month : '0' + month) + "-" + ((day > 9) ? day : '0' + day);
}
function getMonth(){
    var today = new Date();
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    return mm;
}
function getYear () {
    var today = new Date();

    var yyyy = today.getFullYear();
    return yyyy;
}
function lastdayOfTheMonth(y,m){
    return  new Date(y, m +1, 0).getDate();
    }


function sortArray(src) {
    src.sort(function (a, b) {
        return new Date(a) - new Date(b)
    })  
    return src;  
}

function getLuccaLeavesObj(src) {
    var arr = src.reduce((res, date, idx, self) => {
        const rangeStart = !idx || new Date(date) - new Date(self[idx - 1]) > (864e5 / 2),
            rangeEnd = idx == self.length - 1 || new Date(self[idx + 1]) - new Date(date) > (864e5 / 2)
        if (rangeStart) res.push({ startDate: date, endDate: date })
        else if (rangeEnd) res[res.length - 1]['endDate'] = date
        return res
    }, []);
    return arr;
}

module.exports = { getDateFromString, transformToDateFormat,FitnetToluccaDateConvertor, luccaToFitnetDateConvertor, toLuccaDateFormate, lastdayOfTheMonth, getMonth, getYear, sortArray, getLuccaLeavesObj};
