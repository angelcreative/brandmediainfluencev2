import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import { Copy, FileText, Share2, Trash2 } from 'lucide-react'
import { renderIconNode } from 'titan-compositions'

/**
 * Row actions menu (⋯) with leading icons — TitanTableCellActions extraItems omit icons.
 */
export default function ReportRowActions({ rowId, ariaLabel = 'Actions' }) {
  return (
    <div className="table-cell-actions-wrap">
      <MenuTrigger>
        <Button type="button" className="icon-ghost table-cell-actions-trigger" aria-label={ariaLabel}>
          {renderIconNode('more-vertical')}
        </Button>
        <Popover
          className="menu-popover table-row-menu-popover"
          placement="bottom end"
          offset={4}
          shouldFlip
        >
          <Menu
            className="menu-list"
            onAction={(key) => {
              if (key === 'details') console.info('details', rowId)
              else if (key === 'duplicate') console.info('duplicate', rowId)
              else if (key === 'share') console.info('share', rowId)
              else if (key === 'delete-report') console.info('delete', rowId)
            }}
          >
            <MenuItem id="details" className="menu-item" textValue="Report details">
              <span className="menu-item-start">
                <span className="menu-item-icon" aria-hidden>
                  <FileText />
                </span>
                <span className="menu-item-label">Report details</span>
              </span>
            </MenuItem>
            <MenuItem id="duplicate" className="menu-item" textValue="Duplicate">
              <span className="menu-item-start">
                <span className="menu-item-icon" aria-hidden>
                  <Copy />
                </span>
                <span className="menu-item-label">Duplicate</span>
              </span>
            </MenuItem>
            <MenuItem id="share" className="menu-item" textValue="Share">
              <span className="menu-item-start">
                <span className="menu-item-icon" aria-hidden>
                  <Share2 />
                </span>
                <span className="menu-item-label">Share</span>
              </span>
            </MenuItem>
            <MenuItem id="delete-report" className="menu-item menu-item-destructive" textValue="Delete">
              <span className="menu-item-start">
                <span className="menu-item-icon" aria-hidden>
                  <Trash2 />
                </span>
                <span className="menu-item-label">Delete</span>
              </span>
            </MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
    </div>
  )
}
