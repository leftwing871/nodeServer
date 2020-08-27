var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BlogSchema = new Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    writer: {type: String, required: true, max: 30},
    title: {type: String, required: true, max: 100},
    content: {type: String, required: true},
    vote: {type: Number, required: true, default: 0},
    registDate: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('Blog', BlogSchema);
