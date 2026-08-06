import React from "react";
import { Users } from "lucide-react";

interface ShareIconProps {
  color: string;
}

const ShareIcon = ({ color }: ShareIconProps) => {
  return <Users size={20} color={color} />;
};

export default ShareIcon;
