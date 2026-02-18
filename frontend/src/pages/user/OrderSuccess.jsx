import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Package, Home } from "lucide-react";
import { getOrderDetails } from "../../api/orders"; // Assumption: API exists

const OrderSuccess = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Fetch order details if needed, or just display success
                // const data = await getOrderDetails(orderId);
                // setOrder(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                <p className="text-gray-500 mb-8">
                    Thank you for your purchase. Your order <span className="font-mono font-bold text-gray-800">#{orderId?.slice(0, 8)}</span> has been received.
                </p>

                <div className="space-y-3">
                    <Link 
                        to="/account/orders" 
                        className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <Package size={20} /> View Order
                    </Link>
                    <Link 
                        to="/" 
                        className="block w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <Home size={20} /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
