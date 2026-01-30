const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return { id: this._id.toString(), email: this.email, name: this.name };
};

module.exports = mongoose.model('User', userSchema);