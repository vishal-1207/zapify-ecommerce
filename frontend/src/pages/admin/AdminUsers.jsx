import React, { useEffect, useState } from "react";
import {
  Lock,
  Unlock,
  Trash2,
  Shield,
  User,
  Edit2,
  Loader2,
  X,
  Store,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminUsers,
  toggleUserBlockStatusAction,
  deleteUserAction,
  requestUserEditOtpAction,
  updateUserWithOtpAction,
} from "../../store/admin/adminSlice";
import { toast } from "react-hot-toast";
import DataTable from "../../components/common/DataTable";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const {
    users,
    usersLoading: loading,
    usersTotalPages: totalPages,
  } = useSelector((state) => state.admin);

  const [roleFilter, setRoleFilter] = useState("user");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [blockConfirmUser, setBlockConfirmUser] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminUsers({ roleFilter, page, limit }));
  }, [page, roleFilter, limit, dispatch]);

  const switchTab = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const toggleBlockStatus = async (user) => {
    const newStatus = user.isBlocked ? "active" : "blocked";
    dispatch(toggleUserBlockStatusAction({ userId: user.id, newStatus }));
    setBlockConfirmUser(null);
  };

  const handleDelete = async (userId) => {
    await dispatch(deleteUserAction(userId));
    setDeleteConfirmUser(null);

    const newUsers = users.filter((u) => u.id !== userId);
    const targetPage = newUsers.length === 0 && page > 1 ? page - 1 : page;
    if (targetPage !== page) {
      setPage(targetPage); // useEffect will re-fetch
    } else {
      dispatch(fetchAdminUsers({ roleFilter, page, limit }));
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      fullname: user.fullname || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      storeName: user.sellerProfile?.storeName || "",
      storeDescription: user.sellerProfile?.storeDescription || "",
      businessAddress: user.sellerProfile?.businessAddress || "",
    });
    setOtpSent(false);
    setOtpCode("");
    setIsEditModalOpen(true);
  };

  const handleRequestOtp = async () => {
    if (!editingUser) return;
    setIsOtpLoading(true);
    try {
      await dispatch(requestUserEditOtpAction(editingUser.id)).unwrap();
      setOtpSent(true);
      toast.success("OTP sent to user.");
    } catch (err) {
      toast.error(err || "Failed to send OTP.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!editingUser || !otpCode) return;
    setIsOtpLoading(true);
    try {
      await dispatch(
        updateUserWithOtpAction({
          userId: editingUser.id,
          otp: otpCode,
          updateData: formData,
        }),
      ).unwrap();
      toast.success("User profile updated successfully.");
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err || "Failed to update profile.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const isSeller = roleFilter === "seller";

  const filteredUsers = users.filter(
    (user) =>
      user.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: isSeller ? "Seller" : "Customer",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm uppercase shrink-0">
            {user.fullname?.[0] || "?"}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.fullname}</p>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      className: "text-gray-600",
    },
    ...(isSeller
      ? [
          {
            header: "Store",
            render: (user) =>
              user.sellerProfile ? (
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Store size={14} className="text-indigo-400 shrink-0" />
                  <span className="font-medium">
                    {user.sellerProfile.storeName || (
                      <span className="text-gray-400 italic">
                        No store name
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 text-xs italic">No profile</span>
              ),
          },
        ]
      : []),
    {
      header: "Joined",
      render: (user) => (
        <span className="text-gray-500 text-xs">
          {new Date(user.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Status",
      render: (user) =>
        user.isBlocked ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Blocked
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Block / Unblock */}
          <button
            onClick={() => setBlockConfirmUser(user)}
            className={`p-1.5 rounded-md transition-colors ${
              user.isBlocked
                ? "text-green-600 hover:bg-green-100"
                : "text-orange-500 hover:bg-orange-100"
            }`}
            title={user.isBlocked ? "Unblock" : "Block"}
          >
            {user.isBlocked ? <Unlock size={17} /> : <Lock size={17} />}
          </button>

          {/* Edit (OTP) */}
          <button
            onClick={() => openEditModal(user)}
            title="Edit Profile"
            className="cursor-pointer p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Edit2 size={17} />
          </button>

          {/* Delete */}
          <button
            onClick={() => setDeleteConfirmUser(user)}
            title="Delete"
            className="cursor-pointer p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        onSearch={setSearch}
        searchPlaceholder={`Search ${isSeller ? "sellers" : "customers"}...`}
        emptyMessage={`No ${isSeller ? "sellers" : "customers"} found.`}
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: setPage,
          itemsPerPage: limit,
          onItemsPerPageChange: setLimit,
        }}
        filters={
          <div className="flex bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
            <button
              onClick={() => switchTab("user")}
              className={`px-4 py-2 font-medium text-sm rounded-md focus:outline-none flex items-center gap-2 transition-colors ${
                roleFilter === "user"
                  ? "text-indigo-700 bg-indigo-50 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <User size={16} /> Customers
            </button>
            <button
              onClick={() => switchTab("seller")}
              className={`px-4 py-2 font-medium text-sm rounded-md focus:outline-none flex items-center gap-2 transition-colors ${
                roleFilter === "seller"
                  ? "text-indigo-700 bg-indigo-50 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Shield size={16} /> Sellers
            </button>
          </div>
        }
      />

      {/* Block / Unblock Confirmation Modal */}
      {blockConfirmUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-modal-slide">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  blockConfirmUser.isBlocked ? "bg-green-100" : "bg-orange-100"
                }`}
              >
                {blockConfirmUser.isBlocked ? (
                  <Unlock size={20} className="text-green-600" />
                ) : (
                  <Lock size={20} className="text-orange-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {blockConfirmUser.isBlocked ? "Unblock" : "Block"} Account
                </h3>
                <p className="text-sm text-gray-500">
                  {blockConfirmUser.isBlocked
                    ? "This user will regain access."
                    : "This user will lose access immediately."}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to{" "}
              <span className="font-semibold">
                {blockConfirmUser.isBlocked ? "unblock" : "block"}
              </span>{" "}
              <span className="font-semibold text-gray-900">
                {blockConfirmUser.fullname}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockConfirmUser(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleBlockStatus(blockConfirmUser)}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm ${
                  blockConfirmUser.isBlocked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {blockConfirmUser.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-modal-slide">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-900">
                {deleteConfirmUser.fullname}
              </span>
              's account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmUser.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal (OTP-gated) */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-modal-slide">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Edit {isSeller ? "Seller" : "User"} Profile
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  OTP required to save changes
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isOtpLoading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
              {/* Core user fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Seller-specific fields */}
              {editingUser.roles?.includes("seller") && (
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-4">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    Seller Details
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) =>
                        setFormData({ ...formData, storeName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Description
                    </label>
                    <textarea
                      value={formData.storeDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storeDescription: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      value={formData.businessAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessAddress: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              {/* OTP Entry */}
              {otpSent && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <div className="bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-100 mb-3 text-sm">
                    An OTP was sent to the user's email. Ask them for the code
                    to authorize these changes.
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authorization Code (OTP)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-mono tracking-widest text-center text-lg"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={isOtpLoading}
              >
                Cancel
              </button>

              {!otpSent ? (
                <button
                  onClick={handleRequestOtp}
                  disabled={isOtpLoading}
                  className="cursor-pointer flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isOtpLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Request OTP"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSaveEdits}
                  disabled={isOtpLoading || !otpCode}
                  className="cursor-pointer flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isOtpLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
