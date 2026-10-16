import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { MessageSquare, X, ChevronRight } from "lucide-react";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import { ReviewSubSection } from "@madie/madie-util";
import CommentSubSection from "./CommentSubSection";
import { CommentSection } from "./getCommentSectionName";
import "./CommentsFlyoutPanel.scss";

const GENERAL_SECTION = "General";

const subSectionKey = (section: string, subSection: string) =>
  `${section}::${subSection}`;

interface CommentsFlyoutPanelProps {
  open: boolean;
  onClose: () => void;
  sections: CommentSection[];
  sectionName: string;
  mainSection?: string;
  commentedSubSections?: string[];
  readyForReviewBy?: string;
  readyForReviewAt?: string;
}

const CommentsFlyoutPanel = ({
  open,
  onClose,
  sections,
  sectionName,
  mainSection,
  commentedSubSections = [],
  readyForReviewBy,
  readyForReviewAt,
}: CommentsFlyoutPanelProps) => {
  const [comment, setComment] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubSections, setExpandedSubSections] = useState<string[]>([]);
  const [selectedSubSection, setSelectedSubSection] = useState<string>(null);
  const currentKey = mainSection
    ? subSectionKey(mainSection, sectionName)
    : null;
  const hasComment =
    comment
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0;

  useEffect(() => {
    setExpandedSections(mainSection ? [mainSection] : []);
    setExpandedSubSections(currentKey ? [currentKey] : []);
    setSelectedSubSection(currentKey);
  }, [mainSection, sectionName, open]);

  const toggleSection = (section: string, expanded: boolean) =>
    setExpandedSections((expandedNames) =>
      expanded
        ? [...expandedNames, section]
        : expandedNames.filter((name) => name !== section)
    );

  const toggleSubSection = (key: string, expanded: boolean) => {
    setSelectedSubSection(key);
    setExpandedSubSections((keys) =>
      expanded ? [...keys, key] : keys.filter((openKey) => openKey !== key)
    );
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      data-testid="comments-flyout"
    >
      <Box
        role="dialog"
        aria-label="Comments"
        className="comments-flyout-panel"
      >
        <Box className="comments-flyout-panel-header">
          <Box className="comments-flyout-panel-title-row">
            <MessageSquare color="#0096f4" size={14} />
            <Typography variant="h6" className="comments-flyout-panel-title">
              Comments
            </Typography>
          </Box>
          <IconButton
            aria-label="Close comments"
            data-testid="comments-flyout-close"
            onClick={handleClose}
          >
            <X />
          </IconButton>
        </Box>

        <Box className="comments-flyout-panel-sections">
          <Accordion
            disableGutters
            elevation={0}
            expanded={expandedSections.includes(GENERAL_SECTION)}
            onChange={(event, expanded) =>
              toggleSection(GENERAL_SECTION, expanded)
            }
            className="comments-flyout-panel-accordion"
          >
            <AccordionSummary
              expandIcon={<ChevronRight />}
              className="comments-flyout-panel-accordion-summary"
            >
              <Typography className="comments-flyout-panel-section-title">
                {GENERAL_SECTION}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="comments-flyout-panel-general-details">
              <ReviewSubSection
                entityType="library"
                readyForReviewBy={readyForReviewBy}
                readyForReviewAt={readyForReviewAt}
              />
            </AccordionDetails>
          </Accordion>

          {sections.map((section) => {
            const isCurrentSection = section.name === mainSection;
            const subSections = section.subSections.filter(
              (subSection) =>
                commentedSubSections.includes(
                  subSectionKey(section.name, subSection)
                ) ||
                (isCurrentSection && subSection === sectionName)
            );
            if (isCurrentSection && !subSections.includes(sectionName)) {
              subSections.push(sectionName);
            }

            return (
              <Accordion
                key={section.name}
                disableGutters
                elevation={0}
                expanded={expandedSections.includes(section.name)}
                onChange={(event, expanded) =>
                  toggleSection(section.name, expanded)
                }
                className="comments-flyout-panel-accordion"
              >
                <AccordionSummary
                  expandIcon={<ChevronRight />}
                  className="comments-flyout-panel-accordion-summary"
                >
                  <Typography className="comments-flyout-panel-section-title">
                    {section.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="comments-flyout-panel-general-details">
                  {subSections.map((subSection) => {
                    const key = subSectionKey(section.name, subSection);

                    return (
                      <CommentSubSection
                        key={key}
                        title={subSection}
                        highlighted={selectedSubSection === key}
                        expanded={expandedSubSections.includes(key)}
                        onToggle={(expanded) => toggleSubSection(key, expanded)}
                        data-testid={
                          key === currentKey
                            ? "comments-current-subsection"
                            : undefined
                        }
                      />
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        <Box className="comments-flyout-panel-composer">
          <RichTextEditor
            id="comments-flyout-input"
            name="comments-flyout-input"
            data-testid="comments-flyout-input"
            label={`Add a comment to ${sectionName}`}
            content={comment}
            onChange={(value: string) => setComment(value)}
          />
          <Box className="comments-flyout-panel-actions">
            <Button
              variant="outline-secondary"
              disabled={!hasComment}
              onClick={() => setComment("")}
              data-testid="comments-flyout-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!hasComment}
              data-testid="comments-flyout-add"
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CommentsFlyoutPanel;
