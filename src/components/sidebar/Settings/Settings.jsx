import React, { useState, useEffect, useContext } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../../context/authContext';
import { getUserById, updateAdminDetails } from '../../../utils/API_SERVICE';


const Settings = () => {
    const { accessToken, user } = useContext(AuthContext);

    const [profile, setProfile] = useState({});
    const [password, setPassword] = useState('');
console.log(profile);
    
    useEffect(() => {
        if (user && user._id) {
            async function fetchUserData() {
                try {
                    const userData = await getUserById(user._id, accessToken);
                    console.log(userData);
                    setProfile(userData);
                    console.log(profile);
                    
                } catch (error) {
                    toast.error('Error fetching user data');
                }
            }
            fetchUserData();
        }
    }, [user, accessToken]);

    console.log(profile);
    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            setProfile({ ...profile, profileImage: reader.result });
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updatedProfile = await updateAdminDetails(
                profile._id,
                profile.firstname,
                profile.lastname,
                profile.email,
                // profile.status,
                password,
                accessToken
            );
            setProfile(updatedProfile);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error('Error updating profile');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-center mt-6">Profile Settings</h1>
            </div>
            <div className="container mx-auto p-4 bg-white rounded shadow-md max-w-xl">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <img
                                //src={profile.profileImage}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                            />
                            <label
                                htmlFor="profileImage"
                                className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-1 cursor-pointer"
                            >
                                <FaPencilAlt />
                            </label>
                            <input
                                type="file"
                                id="profileImage"
                                className="hidden"
                                onChange={handleProfileImageChange}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            name="firstname"
                            placeholder="First Name"
                            value={profile.firstname}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-full"
                        />
                        <input
                            type="text"
                            name="lastname"
                            placeholder="Last Name"
                            value={profile.lastname}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-full"
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={profile.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-full bg-gray-100"
                    />
                    <input
                        type="password"
                        placeholder="Change Password"
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border rounded-full"
                    />
                    <button
                        type="submit"
                        className="w-full px-3 py-2 text-white rounded-full"
                        style={{ backgroundColor: '#439AB8' }}
                    >
                        Update
                    </button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Settings;