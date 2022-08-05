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

function getTodaysDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy +'-'+ mm + '-' + dd;
    return today;
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
function getDateInFourMonths() {
    var date_in_4_months = new Date();
    date_in_4_months.setMonth(date_in_4_months.getMonth() + 4);
    date_in_4_months = getDateFromString(JSON.stringify(date_in_4_months), 'T',0)
    return date_in_4_months.substring(1);
}
function lastdayOfTheMonth(y,m){
    return  new Date(y, m +1, 0).getDate();
    }
module.exports = { getDateFromString, transformToDateFormat, luccaToFitnetDateConvertor, toLuccaDateFormate, getTodaysDate, getDateInFourMonths, lastdayOfTheMonth, getMonth, getYear};
