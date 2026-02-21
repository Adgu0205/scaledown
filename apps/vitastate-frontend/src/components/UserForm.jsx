import React, { useState, useEffect } from 'react';
import './UserForm.css';
export default function UserForm({ onSubmit }) {
    const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8000/auth';
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Stage 1: Profile
        name: '',
        age: '',
        sex: '',
        heightFeet: '',
        heightInches: '',
        weight: '',
        weightUnit: 'kg',

        // Stage 2: Goals
        goal: '',

        // Stage 3: Activity/Sleep
        activityLevel: '',
        sleepDuration: '',

        // Stage 4: Nutrition
        diet: '',
        allergies: [],

        // Stage 5: Medical
        conditions: [],
        medication: ''
    });

    const [bmi, setBmi] = useState(null);
    const [category, setCategory] = useState('');
    const [heightCm, setHeightCm] = useState(0);

    useEffect(() => {
        calculateBMI();
    }, [formData.heightFeet, formData.heightInches, formData.weight, formData.weightUnit]);

    const calculateBMI = () => {
        let hCm = 0;
        let weightKg = parseFloat(formData.weight) || 0;

        if (formData.heightFeet) {
            const ft = parseFloat(formData.heightFeet) || 0;
            const inch = parseFloat(formData.heightInches) || 0;
            hCm = (ft * 30.48) + (inch * 2.54);
            setHeightCm(Math.round(hCm));
        }

        if (formData.weightUnit === 'lbs') {
            weightKg = weightKg * 0.453592;
        }

        if (hCm > 0 && weightKg > 0) {
            const heightM = hCm / 100;
            const bmiVal = weightKg / (heightM * heightM);
            setBmi(bmiVal.toFixed(1));

            if (bmiVal < 18.5) setCategory('Underweight');
            else if (bmiVal < 24.9) setCategory('Normal');
            else if (bmiVal < 29.9) setCategory('Overweight');
            else setCategory('Obese');
        } else {
            setBmi(null);
            setCategory('');
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (field, value) => {
        const current = formData[field] || [];
        if (current.includes(value)) {
            if (value === 'None') return; // Don't toggle 'None' off if it's sole selection logic handled elsewhere
            setFormData(prev => ({ ...prev, [field]: current.filter(item => item !== value) }));
        } else {
            if (value === 'None') {
                setFormData(prev => ({ ...prev, [field]: ['None'] }));
            } else {
                const newSelect = current.filter(i => i !== 'None');
                setFormData(prev => ({ ...prev, [field]: [...newSelect, value] }));
            }
        }
    };

    const nextStep = (e) => {
        if (e) e.preventDefault();
        if (step < 6) setStep(step + 1);
    };

    const prevStep = (e) => {
        if (e) e.preventDefault();
        if (step > 1) setStep(step - 1);
    };

    const finish = (connectFitbit) => {
        const finalData = { ...formData, bmi, category, height_cm: heightCm };
        onSubmit(finalData);

        if (connectFitbit) {
            window.location.href = `${AUTH_URL}/fitbit/login`;
        }
    };

    return (
        <div className="user-form-page">
            <div className="form-container">

                {/* Tile 1: Basic Information */}
                <div className="tile">
                    <h3>Basic Information</h3>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div className="form-group-row">
                        <div className="half">
                            <label>Age</label>
                            <input type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} />
                        </div>
                        <div className="half">
                            <label>Sex</label>
                            <div className="options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                {['Male', 'Female'].map(opt => (
                                    <button
                                        key={opt}
                                        className={`option-btn ${formData.sex === opt ? 'active' : ''}`}
                                        onClick={() => handleChange('sex', opt)}
                                    >{opt}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tile 2: Body Metrics */}
                <div className="tile">
                    <h3>Body Metrics</h3>
                    <div className="form-group">
                        <label>Height</label>
                        <div className="input-with-unit">
                            <input type="number" placeholder="ft" value={formData.heightFeet} onChange={(e) => handleChange('heightFeet', e.target.value)} />
                            <input type="number" placeholder="in" value={formData.heightInches} onChange={(e) => handleChange('heightInches', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Weight</label>
                        <div className="input-with-unit">
                            <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} />
                            <select value={formData.weightUnit} onChange={(e) => handleChange('weightUnit', e.target.value)}>
                                <option value="kg">kg</option>
                                <option value="lbs">lbs</option>
                            </select>
                        </div>
                    </div>
                    {bmi ? (
                        <div className="bmi-display">
                            <div className="bmi-val">{bmi}</div>
                            <div className={`bmi-cat ${category.toLowerCase()}`}>{category}</div>
                        </div>
                    ) : (
                        <div className="bmi-display" style={{ opacity: 0.5 }}>
                            <div className="bmi-val">--</div>
                            <div className="bmi-cat">BMI</div>
                        </div>
                    )}
                </div>

                {/* Tile 3: Goal & Activity */}
                <div className="tile">
                    <h3>Primary Goal</h3>
                    <div className="options-list">
                        {['Lose fat', 'Gain muscle', 'Improve fitness', 'Maintain health'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${formData.goal === opt ? 'active' : ''}`}
                                onClick={() => handleChange('goal', opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tile 4: Activity Level */}
                <div className="tile">
                    <h3>Activity Level</h3>
                    <div className="options-list">
                        {['Sedentary', 'Lightly active', 'Moderately active', 'Very active'].map(opt => (
                            <button key={opt} className={`option-btn ${formData.activityLevel === opt ? 'active' : ''}`} onClick={() => handleChange('activityLevel', opt)}>{opt}</button>
                        ))}
                    </div>
                </div>

                {/* Tile 5: Sleep & Diet */}
                <div className="tile">
                    <h3>Sleep & Nutrition</h3>
                    <label>Average Sleep</label>
                    <div className="options-grid">
                        {['< 5h', '5-6h', '6-7h', '7-8h', '> 8h'].map(opt => (
                            <button key={opt} className={`option-btn ${formData.sleepDuration === opt ? 'active' : ''}`} onClick={() => handleChange('sleepDuration', opt)}>{opt}</button>
                        ))}
                    </div>

                    <label style={{ marginTop: '1rem' }}>Diet Type</label>
                    <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {['Veg', 'Vegan', 'Non-Veg'].map(opt => (
                            <button key={opt} className={`option-btn ${formData.diet === opt ? 'active' : ''}`} onClick={() => handleChange('diet', opt)}>{opt}</button>
                        ))}
                    </div>

                    <label style={{ marginTop: '1rem' }}>Allergies (Select all that apply)</label>
                    <div className="tags-grid">
                        {['None', 'Peanuts', 'Dairy', 'Gluten', 'Soy', 'Shellfish', 'Eggs', 'Tree Nuts'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${formData.allergies.includes(opt) ? 'active' : ''}`}
                                onClick={() => toggleSelection('allergies', opt)}
                            >{opt}</button>
                        ))}
                    </div>
                </div>

                {/* Tile 6: Health Conditions */}
                <div className="tile">
                    <h3>Health Conditions</h3>
                    <div className="tags-grid">
                        {['None', 'Diabetes', 'High BP', 'Thyroid', 'Asthma', 'Heart'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${formData.conditions.includes(opt) ? 'active' : ''}`}
                                onClick={() => toggleSelection('conditions', opt)}
                            >{opt}</button>
                        ))}
                    </div>

                    <label style={{ marginTop: '1rem' }}>On medication?</label>
                    <div className="options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <button className={`option-btn ${formData.medication === 'Yes' ? 'active' : ''}`} onClick={() => handleChange('medication', 'Yes')}>Yes</button>
                        <button className={`option-btn ${formData.medication === 'No' ? 'active' : ''}`} onClick={() => handleChange('medication', 'No')}>No</button>
                    </div>
                </div>

                {/* Tile 7: Final Actions */}
                <div className="tile" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <h3>All Set?</h3>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>
                        Connect a wearable for the best experience, or start manually.
                    </p>

                    <button className="action-btn fitbit" onClick={() => finish(true)}>
                        Connect Fitbit
                    </button>

                    <button className="action-btn secondary" onClick={() => finish(false)}>
                        Skip & Start
                    </button>
                </div>

            </div>
        </div>
    );
}
