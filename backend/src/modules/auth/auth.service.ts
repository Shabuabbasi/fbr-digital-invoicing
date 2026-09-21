import bcrypt from "bcryptjs";
import { User } from "../../models/User";
import { Company } from "../../models/Company";
import { ApiError } from "../../utils/ApiError";
import { signToken } from "../../middleware/auth";

export async function loginWithCredentials(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({
    sub: user._id.toString(),
    companyId: user.companyId.toString(),
    role: user.role as "ADMIN" | "ACCOUNTANT",
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId.toString(),
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function getCurrentUserContext(userId: string, companyId: string) {
  const [user, company] = await Promise.all([User.findById(userId), Company.findById(companyId)]);

  if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or inactive");
  if (!company) throw ApiError.unauthorized("Company not found");

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId.toString(),
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
    },
    company: {
      id: company._id.toString(),
      name: company.name,
      invoicePrefix: company.invoicePrefix,
    },
  };
}

export async function updateOwnAvatar(userId: string, avatarUrl: string) {
  const user = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
  if (!user) throw ApiError.notFound("User not found");

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId.toString(),
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
  };
}
