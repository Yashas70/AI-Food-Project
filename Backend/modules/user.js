//Schema 
const mongoose=require("mongoose");

const validator=require("validator");

const bcrypt=require("bcryptjs");

const jwt=require("jsonwebtoken");

const crpt=require("crypto");

//create a schema 
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter Your Name"],
        maxlength:[30,"Name cannot exceed 30 characters"]
    },
    email:{
        type:String,
        required:[true,"Please Enter Your Email"],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,"Please Enter a valid Email"]
    },
    password:{
        type:String,
        required:[true,"Please Enter Your Password"],
        minlength:6,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,"Please Confirm Your Password"],
        validate:{
            validator:function(el){
                return el===this.password;
            },
            message:"Password are not the same"
        }
    },
    phoneNumber:{
        type:String,
        required:true,
        match: [/^[0-9]{10}$/, 'Please fill a valid 10 digit phone number']
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    avatar:{
        public_id: String,
        url: String
    },
    passwordChangedAt: Date,
    resetPasswordToken:String,
    passwordResetExpires:Date
},
{
    timestamps: true
});


//Hashing the password 
//pre-save - run before data is saved

userSchema.pre("save",async function(){
    if (!this.isModified("password")) return;

    this.password=await bcrypt.hash(this.password,12)
    this.passwordConfirm=undefined;
})

//password compare

userSchema.methods.correctPassword=async function(candidatePassword,userPassword)
{
    return await bcrypt.compare(candidatePassword,userPassword)
}

//checks whether the users has changed their password after getting the token
// if yes then the token is invalid and user has to login again
userSchema.methods.changedPasswordAfter=function(JWTTimestamp){
    if (this.passwordChangedAt) {
        const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

//custom method to generate a jwt token
userSchema.methods.getJwtToken=function(){
    return jwt.sign(
        {id:this._id},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES}
    )
}
module.exports=mongoose.model("User",userSchema);