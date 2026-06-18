import mongoose from 'mongoose';

const specialtySchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        sub: { type: String },
        desc: { type: String },
        color: { type: String },
        iconColor: { type: String },
        icon: { type: String },
    },
    {
        timestamps: true,
    }
);

const Specialty = mongoose.model('Specialty', specialtySchema);

export default Specialty;
