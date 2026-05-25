import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { renderIconNode } from 'titan-compositions'

/**
 * Row actions: kebab uses Titan `icon-base` (not TitanIconButton).
 */
export default function ReportRowActions({ rowId, access = 'private', status = 'finished', ariaLabel = 'Actions' }) {
  const isFailed = String(status).toLowerCase() === 'failed'

  return (
    <div className="table-cell-actions-wrap">
      <MenuTrigger>
        <Button type="button" className="icon-base table-cell-actions-trigger" aria-label={ariaLabel}>
          {renderIconNode('more-vertical')}
        </Button>
        <Popover
          className="menu-popover table-row-menu-popover"
          placement="bottom end"
          offset={4}
          shouldFlip
        >
          <Menu
            className="menu-list table-row-menu__list"
            onAction={(key) => {
              if (key === 'edit') console.info('edit', rowId)
              else if (key === 'duplicate') console.info('duplicate', rowId)
              else if (key === 'delete-report') console.info('delete', rowId)
            }}
          >
            {!isFailed ? (
              <MenuItem id="edit" className="menu-item" textValue="Edit">
                <span className="menu-item-start">
                  <span className="menu-item-icon" aria-hidden>
                    <Pencil size={16} strokeWidth={2} />
                  </span>
                  <span className="menu-item-label">Edit</span>
                </span>
              </MenuItem>
            ) : null}
            {!isFailed ? (
              <MenuItem id="duplicate" className="menu-item" textValue="Duplicate">
                <span className="menu-item-start">
                  <span className="menu-item-icon" aria-hidden>
                    <Copy size={16} strokeWidth={2} />
                  </span>
                  <span className="menu-item-label">Duplicate</span>
                </span>
              </MenuItem>
            ) : null}
            <MenuItem id="delete-report" className="menu-item menu-item-destructive" textValue="Delete">
              <span className="menu-item-start">
                <span className="menu-item-icon" aria-hidden>
                  <Trash2 size={16} strokeWidth={2} />
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
