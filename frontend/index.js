import {
  initializeBlock,
  useBase,
  useRecordById,
  useLoadable,
  useWatchable,
  useSettingsButton,
  useGlobalConfig,
  TablePickerSynced,
  FieldPickerSynced,
  FormField,
  Box,
  Button,
} from "@airtable/blocks/ui";
import { cursor } from "@airtable/blocks";
import React, { useState, useEffect } from "react";

function HelloWorldBlock() {
  const base = useBase();

  // set up globalconfig.  Used to create and maintain settings
  const globalConfig = useGlobalConfig();
  const tableId = globalConfig.get("selectedTableId");
  const fieldId = globalConfig.get("selectedFieldId");

  // create state values
  // when initially loading the block, check if table or field IDs are undefined
  // that means our global config has not been set and we should go straight to settings
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isShowingSettings, setIsShowingSettings] = useState(() => {
    return tableId === undefined || fieldId === undefined;
  });

  // set up the table we will be rendering in and the field we will look at to see if it has a URL
  const table = base.getTableByIdIfExists(tableId);
  const field = table ? table.getFieldByIdIfExists(fieldId) : null;

  // watch tableId, fieldID, table and field.  If any of these are invalidated at any point
  // go back to settings
  useEffect(() => {
    if (
      tableId === undefined ||
      fieldId === undefined ||
      table === null ||
      field === null
    ) {
      setIsShowingSettings(true);
    }
  }, [tableId, fieldId, table, field]);

  // set up cursor
  useLoadable(cursor);
  useWatchable(cursor, ["selectedRecordIds", "selectedFieldIds"], () => {
    // If the update was triggered by a record being de-selected,
    // the current selectedRecordId will be retained.  This is
    // what enables the caching described above.
    if (cursor.selectedRecordIds.length > 0) {
      // There might be multiple selected records. We'll use the first
      // one.
      setSelectedRecordId(cursor.selectedRecordIds[0]);
    }
  });
  useWatchable(cursor, ["activeTableId"], () => {});

  // try and get the record that the user currently has selected
  const record = useRecordById(table, selectedRecordId ? selectedRecordId : "");

  // use settings.
  // every block has a setting icon in the top right
  // when a user clicks on that, we want to toggle our isShowingSettings flag
  // to either expand or hide the
  useSettingsButton(function () {
    setIsShowingSettings(!isShowingSettings);
  });

  if (isShowingSettings) {
    return (
      <Box>
        <FormField label="Table">
          <TablePickerSynced globalConfigKey="selectedTableId" />
        </FormField>
        <FormField label="Field">
          <FieldPickerSynced table={table} globalConfigKey="selectedFieldId" />
        </FormField>
        <Button
          variant="primary"
          size="large"
          onClick={() => setIsShowingSettings(false)}
        >
          Done
        </Button>
      </Box>
    );
  }

  let content = null;

  if (cursor.activeTableId !== table.id && selectedRecordId === null) {
    content = (
      <div>
        You are not in the right table to preview records. Navigate to{" "}
        {table.name}
      </div>
    );
  } else {
    content = (
      <div>
        <Container>
          {record === null ? (
            <h2>Select a record to preview</h2>
          ) : (
            <iframe
              src={record.getCellValueAsString(field)}
              style={{ flex: "auto", width: "100%" }}
            />
          )}
        </Container>
      </div>
    );
  }

  return <div> {content} </div>;
}

function Container({ children }) {
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
}

initializeBlock(() => <HelloWorldBlock />);
