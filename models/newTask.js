const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    datetime: {
        type: Date,
        required: true
    },
    description: {
        type: String,
    }
}, { timestamps: true })

module.exports = mongoose.model("Task", taskSchema, "tasks")