/*helper classes*/
class FitnetLeave {
    email;
    typeId;
    beginDate;
    endDate;
    startMidday;
    endMidday;

    constructor(email, typeId, beginDate, endDate, startMidday, endMidday) {
        this.email = email;
        this.beginDate = beginDate;
        this.endDate = endDate;
        this.typeId = typeId;

        this.startMidday = startMidday;
        this.endMidday = endMidday;
    }


    toString() {
        console.log("email: " + this.email, "beginDate: " + this.beginDate, "endDate: " + this.endDate, "typeId: " + this.typeId)
    }
}

module.exports = FitnetLeave