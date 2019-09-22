class UpdateReblogsMapIndex < ActiveRecord::Migration[5.2]
  disable_ddl_transaction!

  def up
    remove_index :statuses, name: :index_statuses_on_reblog_of_id_and_account_id
    safety_assured { add_index :statuses, [:reblog_of_id, :account_id], where: 'deleted_at IS NULL', algorithm: :concurrently, name: :index_reblog_statuses }
  end

  def down
    remove_index :statuses, name: :index_reblog_statuses
    safety_assured { add_index :statuses, [:reblog_of_id, :account_id], algorithm: :concurrently }
  end
end
