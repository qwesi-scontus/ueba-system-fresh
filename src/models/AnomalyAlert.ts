import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import EventLog from './EventLog';

export class AnomalyAlert extends Model {
  public id!: string;
  public userId!: string;
  public eventId!: string;
  public anomalyType!: string;
  public riskScore!: number;
  public description!: string;
  public severity!: 'low' | 'medium' | 'high' | 'critical';
  public status!: 'open' | 'investigating' | 'resolved' | 'false_positive';
  public resolvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AnomalyAlert.init(
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
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: EventLog,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    anomalyType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    riskScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved', 'false_positive'),
      defaultValue: 'open',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AnomalyAlert',
    tableName: 'anomaly_alerts',
    timestamps: true,
    underscored: true,
  }
);

EventLog.hasMany(AnomalyAlert, { foreignKey: 'eventId' });
AnomalyAlert.belongsTo(EventLog, { foreignKey: 'eventId' });

export default AnomalyAlert;
