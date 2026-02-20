import React, { useEffect, useState } from "react";
import { Lock, Unlock, Trash2, Shield, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminUsers,
  toggleUserBlockStatusAction,
  deleteUserAction,
} from "../../store/admin/adminSlice";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const {
    users,
    loading,
    usersTotalPages: totalPages,
    error: reduxError,
  } = useSelector((state) => state.admin);

  const [roleFilter, setRoleFilter] = useState(""); // '' for all, 'user', 'seller'
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAdminUsers({ roleFilter, page, limit: 10 }));
  }, [page, roleFilter, dispatch]);

  const toggleBlockStatus = async (user) => {
    const newStatus = user.isBlocked ? "active" : "blocked";
    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`))
      return;

    dispatch(toggleUserBlockStatusAction({ userId: user.id, newStatus }));
  };

  const handleDelete = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action is irreversible.",
      )
    )
      return;
    dispatch(deleteUserAction(userId));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 flex">
        <button
          onClick={() => {
            setRoleFilter("user");
            setPage(1);
          }}
          className={`px-6 py-4 font-medium text-sm focus:outline-none flex items-center gap-2 ${
            roleFilter === "user" || roleFilter === ""
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <User size={16} /> Customers
        </button>
        <button
          onClick={() => {
            setRoleFilter("seller");
            setPage(1);
          }}
          className={`px-6 py-4 font-medium text-sm focus:outline-none flex items-center gap-2 ${
            roleFilter === "seller"
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Shield size={16} /> Sellers
        </button>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                          {user.fullname?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.fullname}
                          </p>
                          <p className="text-xs text-gray-400">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 capitalize">{user.role}</td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleBlockStatus(user)}
                          className={`p-1.5 rounded-md ${
                            user.isBlocked
                              ? "text-green-600 hover:bg-green-100"
                              : "text-orange-600 hover:bg-orange-100"
                          }`}
                          title={user.isBlocked ? "Unblock" : "Block"}
                        >
                          {user.isBlocked ? (
                            <Unlock size={18} />
                          ) : (
                            <Lock size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
