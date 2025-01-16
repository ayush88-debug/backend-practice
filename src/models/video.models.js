import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const vidioSchema=new mongoose.Schema(
    {
        vidioFile:{
            type:String,      //cloudnary url
            required:true,
        },
        thumbnail:{
            type:String,      //cloudnary url
            required:true,
        },
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            required:true
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
    } , {timestamps:true})

vidioSchema.plugin(mongooseAggregatePaginate)


export const vidio=mongoose.model("video", vidioSchema)