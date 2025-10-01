import { z } from 'zod';

const updateHomePageDataZodSchema = z.object({
  subHeader: z.string().optional(),
  header: z.string().optional(),
  description: z.string().optional(),
  rating: z.string().optional(),
  responseTime: z.string().optional(),
  image: z.array(z.string()).optional(),
  activeUser: z.string().optional(),
  paidToTitans: z.string().optional(),
  successRate: z.string().optional(),
  userRating: z.string().optional(),

  // How It Works Section
  howItWorksHeading1: z.string().optional(),
  howItWorksSubheading1: z.string().optional(),
  howItWorksIcon1: z.string().optional(),
  howItWorksHeading2: z.string().optional(),
  howItWorksSubheading2: z.string().optional(),
  howItWorksIcon2: z.string().optional(),
  howItWorksHeading3: z.string().optional(),
  howItWorksSubheading3: z.string().optional(),
  howItWorksIcon3: z.string().optional(),

  // Why Choose Us Section
  whyChooseUsHeading1: z.string().optional(),
  whyChooseUsSubheading1: z.string().optional(),
  whyChooseUsIcon1: z.string().optional(),
  whyChooseUsHeading2: z.string().optional(),
  whyChooseUsSubheading2: z.string().optional(),
  whyChooseUsIcon2: z.string().optional(),
  whyChooseUsHeading3: z.string().optional(),
  whyChooseUsSubheading3: z.string().optional(),
  whyChooseUsIcon3: z.string().optional(),
  whyChooseUsHeading4: z.string().optional(),
  whyChooseUsSubheading4: z.string().optional(),
  whyChooseUsIcon4: z.string().optional(),
});

export const HomePageEditValidation = {
  updateHomePageDataZodSchema,
};
