import React, { useState } from "react";
import Swal from "sweetalert2";

const UserOrder = ({ orders, clearOrders }) => {
    const [submitted, setSubmitted] = useState(false); // Track if order was submitted
    const totalAmount = orders.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Submit order handler
    const handleSubmitMenu = () => {
        if (!orders || orders.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No Items",
                text: "Please add items to your order first.",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        Swal.fire({
            title: "Are you sure?",
            text: "Do you want to submit your order?",
            icon: "question",
            showCancelButton: true,
            cancelButtonColor: "#6c757d",
            confirmButtonColor: "#28a745",
            confirmButtonText: "Yes, submit it!",
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: "success",
                    title: "Order Submitted!",
                    text: "Your order has been submitted successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                setSubmitted(true);  // Disable button
            }
        });
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="card shadow-sm border-0 p-4">
                <h6>Order Summary</h6>
                <p className="text-muted">No items in your order yet.</p>
            </div>
        );
    }

    return (
        <div className="card shadow-sm border-0 p-4 d-flex flex-column h-100" style={{ maxHeight: "80vh" }}>
            <h6>Order Summary</h6>
            <div className="table-responsive flex-grow-1">
                <table className="table table-sm table-striped align-middle mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.name}</td>
                                <td>₱{item.price}</td>
                                <td>{item.qty}</td>
                                <td>₱{(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <hr />
            <h6 className="text-end">Total: ₱{totalAmount.toFixed(2)}</h6>
            <button
                className={`btn btn-success btn-md mt-2`}
                onClick={handleSubmitMenu}
                disabled={submitted} // Disable after submission
            >
                <i className="fas fa-check me-1"></i> {submitted ? "Order Submitted" : "Submit Order"}
            </button>
        </div>
    );
};

export default UserOrder;
