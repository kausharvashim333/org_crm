require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const updateSuperAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to Database.');

    const targetEmail = 'admin@liliorg.in';
    const targetPassword = 'Abc@12345';

    // Check if admin with this email exists
    let admin = await User.findOne({ email: targetEmail });

    if (!admin) {
      // Look for any existing super admin
      admin = await User.findOne({ role: 'super_admin' });
    }

    if (admin) {
      admin.name = 'Super Admin';
      admin.email = targetEmail;
      admin.password = targetPassword;
      admin.role = 'super_admin';
      admin.isActive = true;
      await admin.save();
      console.log(`✅ Super Admin updated successfully!\nEmail: ${targetEmail}\nPassword: ${targetPassword}`);
    } else {
      admin = await User.create({
        name: 'Super Admin',
        email: targetEmail,
        password: targetPassword,
        phone: '9999999999',
        role: 'super_admin',
        isActive: true,
      });
      console.log(`✅ Super Admin created successfully!\nEmail: ${targetEmail}\nPassword: ${targetPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating Super Admin:', error.message);
    process.exit(1);
  }
};

updateSuperAdmin();
