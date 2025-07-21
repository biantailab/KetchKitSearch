export interface PubChemSection {
  TOCHeading: string;
  Information?: {
    URL?: string;
    Value?: {
      StringWithMarkup?: {
        String: string;
      }[];
    };
    Name?: string;
  }[];
  Section?: PubChemSection[];
} 