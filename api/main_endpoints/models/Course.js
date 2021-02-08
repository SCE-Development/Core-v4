const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LessonSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    link: {
      type: String,
      required: true
    },
    courseID:{
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true
    }
  },
  { collection: "Lesson" }
);

const CourseSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    author: {
      type: String
    },
    description: {
      type: String
    },
    summary: {
      type: String,
      required: true
    },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    imageURL: {
      type: String,
      required: true
    }
  },
  { collection: "Course" }
);

module.exports = mongoose.model("Lesson", LessonSchema);
module.exports = mongoose.model("Course", CourseSchema);
