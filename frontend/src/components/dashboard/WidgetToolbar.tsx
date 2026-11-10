import React from "react";
import { Button } from "../ui";
import { AutosaveStatus, WidgetKey } from "./types";
import styles from "./WidgetToolbar.module.css";

export interface WidgetToolbarProps {
  selectedWidgets: WidgetKey[];
  autosaveStatus: AutosaveStatus;
  lastSavedTime: string;
  onToggleWidget: (widgetKey: WidgetKey) => void;
  onAddAllWidgets: () => void;
  onClearAllWidgets: () => void;
}

export const WidgetToolbar: React.FC<WidgetToolbarProps> = ({
  selectedWidgets,
  onToggleWidget,
  onAddAllWidgets,
  onClearAllWidgets,
}) => {
  const isSelected = (key: WidgetKey) => selectedWidgets.includes(key);

  return (
    <div className="widget-toolbar">
      <div className="widget-toolbar-left">
        <div className="widget-toolbar-title">
          <span>Personalized Widgets:</span>
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <div className="widget-pill-group">
          {/* Player Widget Toggle */}
          <Button
            className={`widget-pill-btn ${isSelected("players") ? "active" : ""}`}
            onClick={() => onToggleWidget("players")}
            title="Toggle Player Widget"
          >
            <span>Player Widget</span>
          </Button>

          {/* Tournament Widget Toggle */}
          <Button
            className={`widget-pill-btn ${isSelected("tournaments") ? "active" : ""}`}
            onClick={() => onToggleWidget("tournaments")}
            title="Toggle Tournament Widget"
          >
            <span>Tournament Widget</span>
          </Button>

          {/* Team Widget Toggle */}
          <Button
            className={`widget-pill-btn ${isSelected("teams") ? "active" : ""}`}
            onClick={() => onToggleWidget("teams")}
            title="Toggle Team Widget"
          >
            <span>Team Widget</span>
          </Button>

          {/* Sponsor Widget Toggle */}
          <Button
            className={`widget-pill-btn ${isSelected("sponsors") ? "active" : ""}`}
            onClick={() => onToggleWidget("sponsors")}
            title="Toggle Sponsor Widget"
          >
            <span>Sponsor Widget</span>
          </Button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className={styles.actionsGroup}>
          {selectedWidgets.length < 4 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddAllWidgets}
              title="Add all 4 widgets to dashboard"
              className={styles.actionBtn}
            >
              Add All
            </Button>
          )}

          {selectedWidgets.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearAllWidgets}
              title="Clear all active widgets"
              className={styles.clearBtn}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
