import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// User data
const users = [
  {
    email: "admin@jezx.com",
    password: "admin@123",
    data: {
      name: "Admin - JezX",
      role: "admin",
      avatar: "",
      createdAt: new Date().toISOString(),
    }
  },
  {
    email: "demo@jezx.com",
    password: "user@123",
    data: {
      name: "Demo User",
      role: "user",
      avatar: "",
      createdAt: new Date().toISOString(),
    }
  }
];

// Function to create a user in Firebase Authentication and Firestore
const createUser = async (email: string, password: string, userData: any) => {
  const auth = getAuth();
  
  try {
    console.log(`Checking if user '${email}' already exists...`);
    // Check if user already exists in Firestore by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log(`User with email ${email} already exists.`);
      return;
    }
    
    // Create user in Firebase Authentication
    console.log(`Creating user '${email}' in Firebase Authentication...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user data to Firestore
    console.log(`Adding user '${email}' data to Firestore...`);
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      email,
    });
    
    console.log(`User ${email} created successfully.`);
    
    // Create some initial leads for this user
    await createInitialLeadsForUser(user.uid, email);
    
  } catch (error: any) {
    console.error(`Error creating user ${email}:`, error.message);
  }
};

// Create some test leads for new users
const createInitialLeadsForUser = async (userId: string, userEmail: string) => {
  try {
    console.log(`Creating sample leads for user '${userEmail}'...`);
    const leadsRef = collection(db, "leads");
    
    // Sample leads data with all required fields
    const sampleLeads = [
      {
        name: "John Smith",
        company: "Acme Inc.",
        email: "john@acme.com",
        phone: "555-123-4567",
        address: "123 Main St, Anytown, USA",
        projectRequirementTitle: "Website Redesign",
        projectRequirementDetails: "Looking to modernize company website with latest design trends",
        stage: "new",
        value: 5000,
        assignedTo: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: []
      },
      {
        name: "Jane Doe",
        company: "XYZ Corp",
        email: "jane@xyz.com",
        phone: "555-987-6543",
        address: "456 Oak Ave, Somewhere, USA",
        projectRequirementTitle: "Mobile App Development",
        projectRequirementDetails: "Need a cross-platform app for customer engagement",
        stage: "contacted",
        value: 15000,
        assignedTo: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: []
      }
    ];
    
    for (const lead of sampleLeads) {
      await addDoc(leadsRef, lead);
    }
    
    console.log(`Created ${sampleLeads.length} sample leads for user '${userEmail}'`);
  } catch (error) {
    console.error("Error creating sample leads:", error);
  }
};

// Initialize users
export const initializeUsers = async () => {
  console.log("Initializing demo users...");
  
  try {
    for (const user of users) {
      await createUser(user.email, user.password, user.data);
    }
    
    console.log("User initialization complete.");
  } catch (error) {
    console.error("Error initializing users:", error);
    throw error;
  }
};

// Function to check if users are initialized
export const checkUsersInitialized = async (): Promise<boolean> => {
  try {
    console.log("Checking if users are initialized...");
    // Check if admin user exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", "admin@jezx.com"), limit(1));
    const querySnapshot = await getDocs(q);
    
    const result = !querySnapshot.empty;
    console.log("Users initialized:", result);
    return result;
  } catch (error) {
    console.error("Error checking if users are initialized:", error);
    return false;
  }
}; 