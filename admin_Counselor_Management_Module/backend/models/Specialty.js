import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sub: {
        type: String,
        trim: true
    },
    desc: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#e2e8f0'
    },
    iconColor: {
        type: String,
        default: '#475569'
    },
    icon: {
        type: String,
        default: 'award'
    }
}, {
    timestamps: true
});

const Specialty = mongoose.model('Specialty', specialtySchema);
export default Specialty;
