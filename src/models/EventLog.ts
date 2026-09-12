import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class EventLog extends Model {
  public id!: string;
  public userId!: string;
  public eventType!: string;
  public timestamp!: Date;
  public sourceIp!: string;
  public action!: string;
  public resource!: string;
  public result!: 'success' | 'failure';
  public metadata!: Record<string, any>;
  public riskScore?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EventLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true,
    },
    sourceIp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    result: {
      type: DataTypes.ENUM('success', 'failure'),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    riskScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'EventLog',
    tableName: 'event_logs',
    timestamps: true,
    underscored: true,
  }
);

export default EventLog;
