import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    category: "Buying and Accounts",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order is shipped, you will receive an email with the tracking number. You can also view real-time tracking updates in the 'Your Orders' section of your account dashboard."
      },
      {
        q: "What is the return policy?",
        a: "Items can be returned within 30 days of delivery, provided they are in their original condition and packaging. To initiate a return, visit your order details page."
      },
      {
        q: "How do I manage my saved addresses?",
        a: "You can add, edit, or remove shipping addresses from the 'Addresses' tab inside your Account settings. You can also select a default address for faster checkout."
      },
      {
        q: "Can I review a product I purchased?",
        a: "Yes! Once an order is delivered, you can navigate to 'My Reviews' in your account to leave a rating and review for the product and the seller."
      }
    ]
  },
  {
    category: "Selling and Inventory",
    items: [
      {
        q: "How do I list a product?",
        a: "If the product already exists in the Zapify catalog, you can simply add an 'Offer' with your price and stock. If it's a new product, you can suggest it via 'Add Product' for admin approval."
      },
      {
        q: "How do I manage my active offers?",
        a: "Navigate to the 'Offers' tab in your Seller Dashboard. Here you can update your stock quantities, base prices, or set up temporary Deal Prices."
      },
      {
        q: "What happens when an order is placed?",
        a: "It will appear in your 'Orders' tab as 'Pending'. Once you pack and ship the item, you must update the status to 'Shipped' and eventually 'Delivered'."
      },
      {
        q: "What are the fees for selling?",
        a: "Zapify currently charges a competitive 5% platform fee on all successful transactions. There are no listing or subscription fees."
      }
    ]
  },
  {
    category: "Payments and Security",
    items: [
      {
        q: "What payment methods are supported?",
        a: "We accept all major credit cards, debit cards, PayPal, and Apple Pay/Google Pay via our secure Stripe integration."
      },
      {
        q: "Are my credit card details secure?",
        a: "Yes. Zapify does not store any raw credit card numbers. All payment data is tokenized and encrypted by Stripe, a certified PCI Level 1 Service Provider."
      },
      {
        q: "How and when do sellers get paid?",
        a: "Payouts are processed automatically via Stripe Connect. Funds from delivered orders are accumulated and paid out to your linked bank account on a weekly rolling basis."
      }
    ]
  }
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        className="w-full text-left py-4 flex justify-between items-center focus:outline-none"
        onClick={onToggle}
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="bg-indigo-600 border-b border-indigo-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto">
            Find answers to common questions about buying and selling on Zapify.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 max-w-3xl">
        {faqs.map((group, idx) => (
          <div key={idx} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{group.category}</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6">
              {group.items.map((item, i) => {
                const id = `${idx}-${i}`;
                return (
                  <FAQItem 
                    key={id} 
                    question={item.q} 
                    answer={item.a} 
                    isOpen={openId === id}
                    onToggle={() => setOpenId(openId === id ? null : id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
