import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Profile = () => {
  const { userData, setUserData, backend, usertoken, profileData } = useContext(AppContext);

  const [edit, setEdit] = useState(false);
  const [image, setImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateProfile = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", userData.name || "");
      formData.append("gender", userData.gender || "");
      formData.append("dob", userData.dob || "");
      if (image) formData.append("image", image);

      const { data } = await axios.post(backend + "/api/user/update-profile", formData, {
        headers: { usertoken },
      });

      if (data.success) {
        toast.success(data.message || "Profile updated");
        await profileData();
        setEdit(false);
        setImage(false);
      } else {
        toast.error(data.message || "Could not update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-300">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-12 p-6 bg-[#141b32] rounded-2xl shadow-xl text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-6">
        {/* Avatar: circular white plate with purple border */}
        <div className="relative">
          {edit ? (
            <label htmlFor="image" className="cursor-pointer">
              <div
                className="w-36 h-36 rounded-full bg-white flex items-center justify-center overflow-hidden border-4"
                style={{ borderColor: "#6a34c7" }} // purple border
              >
                {image ? (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : userData.image ? (
                  <img src={userData.image} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <img src={assets.user_placeholder} alt="placeholder" className="w-1/2 h-1/2" />
                )}
              </div>

              {/* Upload icon overlay */}
              {/* <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[#6a34c7] flex items-center justify-center shadow-md">
                <img src={assets.upload_icon} alt="upload" className="w-5" />
              </div> */}

              <input
                id="image"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImage(file);
                }}
              />
            </label>
          ) : (
            <div
              className="w-32 h-32 rounded-full bg-white flex items-center justify-center overflow-hidden border-4"
              style={{ borderColor: "#6a34c7" }}
            >
              {userData.image ? (
                <img src={userData.image} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <img src={assets.user_placeholder} alt="placeholder" className="w-1/2 h-1/2" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          {edit ? (
            <input
              type="text"
              value={userData.name || ""}
              onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full text-2xl font-semibold bg-transparent border-b-2 border-purple-600 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-sm"
              placeholder="Your name"
            />
          ) : (
            <p className="text-2xl font-semibold text-white">{userData.name || "Unnamed User"}</p>
          )}

          <p className="text-sm text-gray-400 mt-1">{userData.email}</p>

          <div className="mt-3 flex items-center gap-3">
            {edit ? (
              <>
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-full transition ${
                    saving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setEdit(false);
                    setImage(false);
                  }}
                  className="bg-transparent border border-purple-600 text-purple-200 px-4 py-2 rounded-full hover:bg-white/5"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEdit(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-full transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="my-8 border-purple-700/40" />

      {/* Contact Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-purple-300 border-b border-purple-700 pb-2">CONTACT INFORMATION</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm text-gray-100">{userData.email || "—"}</p>
          </div>

          {/* <div>
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-sm text-gray-100">{userData.phone || "Not provided"}</p>
          </div> */}
        </div>
      </section>

      <hr className="my-8 border-purple-700/40" />

      {/* Basic Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-purple-300 border-b border-purple-700 pb-2">BASIC INFORMATION</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-center">
          <div>
            <p className="text-xs text-gray-400">Gender</p>
            {edit ? (
              <select
                value={userData.gender || ""}
                onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option className="bg-[#141B32]" value="">Select gender</option>
                <option className="bg-[#141B32]" value="Male">Male</option>
                <option className="bg-[#141B32]" value="Female">Female</option>
                <option className="bg-[#141B32]" value="Other">Other</option>
              </select>
            ) : (
              <p className="text-sm text-gray-100">{userData.gender || "—"}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-400">Birthday</p>
            {edit ? (
              <input
                type="date"
                value={userData.dob || ""}
                onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
                className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            ) : (
              <p className="text-sm text-gray-100">{userData.dob || "—"}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
