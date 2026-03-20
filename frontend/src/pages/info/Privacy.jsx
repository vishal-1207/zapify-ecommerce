import React from "react";

const Privacy = () => {
  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="border-b border-gray-200 py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-500">Last Updated: October 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 max-w-4xl prose prose-indigo">
        <p className="text-lg text-gray-600 mb-8">
          At Zapify, we take your privacy seriously. This Privacy Policy
          explains how Zapify Inc. ("we", "us", or "our") collects, uses,
          discloses, and safeguards your information when you visit our website
          or use our e-commerce platform services. Please read this privacy
          policy carefully. If you do not agree with the terms of this privacy
          policy, please do not access the site.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          1. Information We Collect
        </h2>
        <p className="text-gray-600 mb-6">
          <strong>Personal Data:</strong> We may collect personally identifiable
          information, such as your name, shipping address, email address, and
          telephone number, and demographic information, such as your age or
          gender, that you voluntarily give to us when you register with the
          Site or when you choose to participate in various activities related
          to the Site, such as online chat and message boards.
          <br />
          <br />
          <strong>Derivative Data:</strong> Information our servers
          automatically collect when you access the Site, such as your IP
          address, your browser type, your operating system, your access times,
          and the pages you have viewed directly before and after accessing the
          Site.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          2. Financial and Payment Data
        </h2>
        <p className="text-gray-600 mb-6">
          Financial information, such as data related to your payment method
          (e.g., valid credit card number, card brand, expiration date) that we
          may collect when you purchase, order, return, exchange, or request
          information about our services from the Site. We store only very
          limited, if any, financial information that we collect. Otherwise, all
          financial information is stored by our payment processor, Stripe, and
          you are encouraged to review their privacy policy and contact them
          directly for responses to your questions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          3. How We Use Your Information
        </h2>
        <p className="text-gray-600 mb-6">
          Having accurate information about you permits us to provide you with a
          smooth, efficient, and customized experience. Specifically, we may use
          information collected about you via the Site to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-6">
          <li>Create and manage your account.</li>
          <li>
            Fulfill and manage purchases, orders, payments, and other
            transactions related to the Site.
          </li>
          <li>
            Deliver targeted advertising, coupons, newsletters, and other
            information regarding promotions and the Site to you.
          </li>
          <li>Increase the efficiency and operation of the Site.</li>
          <li>
            Monitor and analyze usage and trends to improve your experience with
            the Site.
          </li>
          <li>Notify you of updates to the Site.</li>
          <li>
            Prevent fraudulent transactions, monitor against theft, and protect
            against criminal activity.
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          4. Sharing Your Information
        </h2>
        <p className="text-gray-600 mb-6">
          We may share information we have collected about you in certain
          situations. Your information may be disclosed as follows:
          <br />
          <br />
          <strong>Third-Party Sellers:</strong> We only share necessary shipping
          and contact details with the third-party sellers fulfilling your
          specific orders.
          <br />
          <br />
          <strong>Service Providers:</strong> We may share your information with
          third parties that perform services for us or on our behalf, including
          payment processing, data analysis, email delivery, hosting services,
          customer service, and marketing assistance.
          <br />
          <br />
          <strong>By Law or to Protect Rights:</strong> If we believe the
          release of information about you is necessary to respond to legal
          process, to investigate or remedy potential violations of our
          policies, or to protect the rights, property, and safety of others, we
          may share your information as permitted or required by any applicable
          law, rule, or regulation.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          5. Cookies and Web Beacons
        </h2>
        <p className="text-gray-600 mb-6">
          We may use cookies, web beacons, tracking pixels, and other tracking
          technologies on the Site to help customize the Site and improve your
          experience. When you access the Site, your personal information is not
          collected through the use of tracking technology. Most browsers are
          set to accept cookies by default. You can remove or reject cookies,
          but be aware that such action could affect the availability and
          functionality of the Site.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          6. Security of Your Information
        </h2>
        <p className="text-gray-600 mb-6">
          We use administrative, technical, and physical security measures to
          help protect your personal information. While we have taken reasonable
          steps to secure the personal information you provide to us, please be
          aware that despite our efforts, no security measures are perfect or
          impenetrable, and no method of data transmission can be guaranteed
          against any interception or other type of misuse.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          7. Policy for Children
        </h2>
        <p className="text-gray-600 mb-6">
          We do not knowingly solicit information from or market to children
          under the age of 13. If you become aware of any data we have collected
          from children under age 13, please contact us using the contact
          information provided below.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          8. Contact Us
        </h2>
        <p className="text-gray-600 mb-6">
          If you have questions or comments about this Privacy Policy, please
          contact us at: <br />
          Zapify Inc.
          <br />
          privacy@zapify.com
          <br />
          1-800-ZAPIFY-HELP
        </p>
      </div>
    </div>
  );
};

export default Privacy;
